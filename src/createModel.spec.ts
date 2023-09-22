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
      states: [
        { name: 'zero', schema: z.object({ count: z.literal(0) }) },
        { name: 'positive', schema: z.object({ count: z.literal(1) }) },
        { name: 'negative', schema: z.object({ count: z.literal(-1) }) },
        { name: 'unknown', schema: z.object({ count: z.number() }) },
      ],
      events: [
        { name: 'ADD_ONE', schema: {} },
        { name: 'MINUS_ONE', schema: {} },
      ],
    },
    stateMap: {
      zero: {
        ADD_ONE: {
          invoke: addOne,
          onResult: [
            { cond: isError, target: 'unknown' as const },
            { target: 'positive' as const },
          ],
        },
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [
            { cond: isError, target: 'unknown' as const },
            { target: 'negative' as const },
          ],
        },
      },
      positive: {
        MINUS_ONE: {
          invoke: minusOne,
          onResult: [
            { cond: isError, target: 'unknown' as const },
            { target: 'zero' as const },
          ],
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
    const zeroCounter = counterModel.asState('test', { count: 0 });
    expect(zeroCounter.getData()).toStrictEqual({ count: 0 });
    expect(zeroCounter.getState()).toBe('unknown');
  });

  it('goes to unknown variant if invalid data', () => {
    const counterModel = testHarness();
    const zeroCounter = counterModel.asState('zero', { count: 1 });
    expect(zeroCounter.getData()).toStrictEqual({ count: 1 });
    expect(zeroCounter.getState()).toBe('unknown');
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
    const unknownCounter = positiveCounter.send('ADD_ONE');
    expect(unknownCounter.getData()).toStrictEqual({ count: 1 });
    expect(unknownCounter.getState()).toBe('unknown');
  });
});
