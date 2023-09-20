import { main } from 'src';

describe('Proof of Concept (unit)', () => {
  it('passes', () => {
    expect(main(false)).toBe(false);
  });
});
