import { overlapAllowed } from './overlap-allowed';
import { intersectionArea } from './intersection-area';

describe('clip grid geometry', () => {
  it('allows an overlap of exactly half the smaller card', () => {
    const first = { x: 0, y: 0, width: 16, height: 12 };
    const second = { x: 8, y: 0, width: 16, height: 12 };

    expect(intersectionArea(first, second)).toBe(96);
    expect(overlapAllowed(first, second)).toBe(true);
  });

  it('rejects an overlap larger than half the smaller card', () => {
    const first = { x: 0, y: 0, width: 16, height: 12 };
    const second = { x: 7, y: 0, width: 16, height: 12 };

    expect(intersectionArea(first, second)).toBe(108);
    expect(overlapAllowed(first, second)).toBe(false);
  });

  it('handles cards with different content heights', () => {
    const photo = { x: 0, y: 0, width: 16, height: 24 };
    const note = { x: 8, y: 12, width: 16, height: 8 };

    expect(intersectionArea(photo, note)).toBe(64);
    expect(overlapAllowed(photo, note)).toBe(true);
  });
});
