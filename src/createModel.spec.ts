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
      states: {
        zero: z.object({ count: z.literal(0) }),
        positive: z.object({ count: z.literal(1) }),
        negative: z.object({ count: z.literal(-1) }),
      },
      events: {
        ADD_ONE: {},
        MINUS_ONE: {},
      },
    },
    stateMap: {
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
          onResult: [
            { cond: isError, target: 'unknown' as const },
            { target: 'zero' as const },
          ],
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
    const zeroCounter = counterModel.asState('zero', { count: 0 });
    expect(zeroCounter.getData()).toStrictEqual({ count: 0 });
    expect(zeroCounter.getState()).toBe('zero');
  });

  it('goes to unknown variant if unrecognized state', () => {
    const counterModel = testHarness();
    // const zeroCounter = counterModel.asState('test', { count: 0 }); // <-- unrecognized state
    const testThrow = () => counterModel.asState('test' as any, { count: 0 });
    expect(testThrow).toThrow('Unable to instantiate unrecognized state: test');
  });

  it('goes to unknown variant if invalid data', () => {
    const counterModel = testHarness();
    // const zeroCounter = counterModel.asState('zero', { count: 1 }); // <-- invalid data
    const testThrow = () => counterModel.asState('zero', { count: 1 as any });
    expect(testThrow).toThrow('Invalid data for provided state');
  });

  it('goes to positive variant', () => {
    const counterModel = testHarness();
    const zeroCounter = counterModel.asState('zero', { count: 0 });
    const positiveCounter = zeroCounter.send('ADD_ONE');
    expect(positiveCounter.getData()).toStrictEqual({ count: 1 });
    expect(positiveCounter.getState()).toBe('positive');
  });

  it('goes to unknown variant on unexpedted event', () => {
    const counterModel = testHarness();
    const positiveCounter = counterModel.asState('positive', { count: 1 });
    expect(positiveCounter.getState()).toBe('positive');
    // const unknownCounter = positiveCounter.send('ADD_ONE'); // <-- unexpected event
    const unknownCounter = positiveCounter.send('ADD_ONE' as any);
    expect(unknownCounter.getData()).toStrictEqual({ count: 1 });
    expect(unknownCounter.getState()).toBe('unknown');
  });
});
