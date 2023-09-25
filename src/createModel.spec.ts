import { z } from 'zod';

import { createModel } from 'src/createModel';

const testHarness = () => {
  const addOne = (data: any) => {
    return {
      count: data.count + 1,
    };
  };
  const minusOne = (data: any) => {
    return {
      count: data.count - 1,
    };
  };
  const isError = (_data: any, error: Error) => {
    return !!error;
  };
  const counterModel = createModel({
    manifest: {
      variants: {
        zero: z.object({ count: z.literal(0) }),
        positive: z.object({ count: z.literal(1) }),
        negative: z.object({ count: z.literal(-1) }),
      },
      events: {
        ADD_ONE: {},
        MINUS_ONE: {},
      },
    },
    variantMap: {
      zero: {
        ADD_ONE: {
          invoke: addOne,
          onResult: [
            { cond: isError, target: 'unknown' },
            { target: 'positive' },
          ],
        },
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [
            { cond: isError, target: 'unknown' },
            { target: 'negative' },
          ],
        },
        // TODO: Should result in type error
        // FAKE_EVENT: {
        //   invoke: minusOne,
        //   onResult: [{ cond: isError, target: 'unknown' }, { target: 'zero' }],
        // },
      },
      positive: {
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [{ cond: isError, target: 'unknown' }, { target: 'zero' }],
        },
      },
      negative: {
        ADD_ONE: {
          invoke: addOne,
          onResult: [{ cond: isError, target: 'unknown' }, { target: 'zero' }],
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
    expect(zeroCounter.getVariantData()).toStrictEqual({ count: 0 });
    expect(zeroCounter.getVariantName()).toBe('zero');
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
    expect(testThrow).toThrow('Invalid data for provided variant');
  });

  it('throws error when it receives unexpected even', () => {
    const counterModel = testHarness();
    const positiveCounter = counterModel.asVariant('positive', { count: 1 });
    expect(positiveCounter.getVariantName()).toBe('positive');
    // const unknownCounter = positiveCounter.send('ADD_ONE'); // <-- unexpected event
    const testThrow = () => positiveCounter.send('ADD_ONE' as any);
    expect(testThrow).toThrow(
      'Unrecognized event: ADD_ONE for variant: positive',
    );
  });

  it('goes to positive variant', () => {
    const counterModel = testHarness();
    const zeroCounter = counterModel.asVariant('zero', { count: 0 });
    const positiveCounter = zeroCounter.send('ADD_ONE');
    expect(positiveCounter.getVariantData()).toStrictEqual({ count: 1 });
    expect(positiveCounter.getVariantName()).toBe('positive');
  });
});
