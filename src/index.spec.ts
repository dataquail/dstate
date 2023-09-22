import { createAggregate } from 'src';

describe('Proof of Concept (unit)', () => {
  it('starts at zero', () => {
    const aggregate = createAggregate();
    expect(aggregate.getCurrentState()).toBe('zero');
  });

  it('increments to one', () => {
    const aggregate = createAggregate();
    aggregate.send('ADD_ONE');
    expect(aggregate.getCurrentState()).toBe('positive');
    expect(aggregate.getAggregateData().count).toBe(1);
  });

  it('ignores increments while in positive state', () => {
    const aggregate = createAggregate();
    aggregate.send('ADD_ONE');
    expect(aggregate.getCurrentState()).toBe('positive');
    expect(aggregate.getAggregateData().count).toBe(1);
    aggregate.send('ADD_ONE');
    expect(aggregate.getCurrentState()).toBe('positive');
    expect(aggregate.getAggregateData().count).toBe(1);
  });

  it('ignores decrements while in negative state', () => {
    const aggregate = createAggregate();
    aggregate.send('MINUS_ONE');
    expect(aggregate.getCurrentState()).toBe('negative');
    expect(aggregate.getAggregateData().count).toBe(-1);
    aggregate.send('MINUS_ONE');
    expect(aggregate.getCurrentState()).toBe('negative');
    expect(aggregate.getAggregateData().count).toBe(-1);
  });
});
