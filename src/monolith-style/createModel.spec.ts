import { z } from 'zod';

import { type Event, createModel } from 'src/monolith-style/createModel';

const testHarness = () => {
  const addOne = (data: { count: 0 | -1 }) => {
    return {
      count: (data.count + 1) as 1 | 0,
    };
  };
  const minusOne = (data: { count: 0 | 1 }) => {
    return {
      count: (data.count - 1) as -1 | 0,
    };
  };

  type AddOneEvent = Event<'ADD_ONE', never>;
  type MinusOneEvent = Event<'MINUS_ONE', never>;
  type Events = AddOneEvent | MinusOneEvent;

  const createSchema = <T>() => null as unknown as T;
  const counterModel = createModel({
    manifest: {
      variants: {
        zero: z.object({ count: z.literal(0) }),
        positive: z.object({ count: z.literal(1) }),
        negative: z.object({ count: z.literal(-1) }),
      },
      eventSchema: createSchema<Events>(),
    },
    variantMap: {
      zero: {
        ADD_ONE: {
          invoke: addOne,
          onResult: [{ target: 'positive' }],
        },
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [{ target: 'negative' }],
        },
      },
      positive: {
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [{ target: 'zero' }],
        },
      },
      negative: {
        ADD_ONE: {
          invoke: addOne,
          onResult: [{ target: 'zero' }],
        },
      },
    },
  });

  return counterModel;
};

describe('createModel', () => {
  it('is instantiated without error', () => {
    testHarness();
  });

  it('initializes the zeroAggregate variant', () => {
    const counterModel = testHarness();
    const zeroCounter = counterModel.asVariant('zero', { count: 0 });
    expect(zeroCounter.variantData).toStrictEqual({ count: 0 });
    expect(zeroCounter.variantName).toBe('zero');
  });

  it('throws error when instantiating invalid state', () => {
    const counterModel = testHarness();
    // const zeroCounter = counterModel.asVariant('test', { count: 0 }); // <-- unrecognized state
    const testThrow = () => counterModel.asVariant('test' as any, { count: 0 });
    expect(testThrow).toThrow(
      'Unable to instantiate unrecognized variant: test',
    );
  });

  it('throws error when instantiating with invalid data', () => {
    const counterModel = testHarness();
    // const zeroCounter = counterModel.asVariant('zero', { count: 1 }); // <-- invalid data
    const testThrow = () => counterModel.asVariant('zero', { count: 1 as any });
    expect(testThrow).toThrow(
      'Unable to instantiate variant: zero due to invalid initial data',
    );
  });

  it('throws error when it receives unexpected even', () => {
    const counterModel = testHarness();
    const positiveCounter = counterModel.asVariant('positive', { count: 1 });
    expect(positiveCounter.variantName).toBe('positive');
    // const unknownCounter = positiveCounter.send('ADD_ONE'); // <-- unexpected event
    const testThrow = () => positiveCounter.send('ADD_ONE' as any);
    expect(testThrow).toThrow(
      'Unrecognized event: ADD_ONE for variant: positive',
    );
  });

  it('goes from zero to positive variant', () => {
    const counterModel = testHarness();
    const zeroCounter = counterModel.asVariant('zero', { count: 0 });
    const positiveCounter = zeroCounter.send('ADD_ONE');
    expect(positiveCounter.variantData).toStrictEqual({ count: 1 });
    expect(positiveCounter.variantName).toBe('positive');
  });

  it('goes from positive to zero variant', () => {
    const counterModel = testHarness();
    const positiveCounter = counterModel.asVariant('positive', { count: 1 });
    const unknownCounter = positiveCounter.send('MINUS_ONE');
    expect(unknownCounter.variantData).toStrictEqual({ count: 0 });
    expect(unknownCounter.variantName).toBe('zero');
  });
});
