import { main } from 'src';

describe('Proof of Concept (e2e)', () => {
  it('passes', () => {
    expect(main(true)).toBe(true);
  });
});
