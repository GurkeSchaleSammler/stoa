import { boardCursorPosition } from './board-presence';

describe('board cursor coordinates', () => {
  it('keeps positions stable at different zoom levels and scroll offsets', () => {
    expect(
      boardCursorPosition(160, 200, { left: 20, top: 60, width: 2240, height: 3360 }, 2240, 3360),
    ).toEqual({ x: 140, y: 140 });
    expect(
      boardCursorPosition(
        160,
        200,
        { left: -120, top: -80, width: 4480, height: 6720 },
        2240,
        3360,
      ),
    ).toEqual({ x: 140, y: 140 });
  });
  it('hides a captured pointer outside the board and ignores invalid dimensions', () => {
    expect(
      boardCursorPosition(-1, 20, { left: 0, top: 0, width: 2240, height: 3360 }, 2240, 3360),
    ).toBeNull();
    expect(
      boardCursorPosition(1, 2, { left: 0, top: 0, width: 0, height: 0 }, 2240, 3360),
    ).toBeNull();
  });
});
