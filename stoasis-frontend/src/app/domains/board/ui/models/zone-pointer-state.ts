export interface ZonePointerState {
  pointerId: number;
  zoneId: string | null;
  mode: 'draw' | 'move' | 'resize';
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
}
