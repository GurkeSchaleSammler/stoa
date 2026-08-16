import { GridRect } from './grid-rect';
import { intersectionArea } from './intersection-area';

export function overlapAllowed(a: GridRect, b: GridRect): boolean {
  const smallerArea = Math.min(a.width * a.height, b.width * b.height);
  return intersectionArea(a, b) <= 0.5 * smallerArea;
}
