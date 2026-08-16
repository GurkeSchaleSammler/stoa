export interface StackDragState {
  pointerId: number;
  stackId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  leftPx: number;
  topPx: number;
  layer: number;
  moved: boolean;
  invalid: boolean;
}
