import { main } from 'src/prototypes/poc';

describe('Proof of Concept (e2e)', () => {
  it('passes', () => {
    expect(main(true)).toBe(true);
  });
});
