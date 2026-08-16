export interface StackChildDragState {
  pointerId: number;
  stackId: string;
  pinId: string;
  startClientX: number;
  startClientY: number;
  deltaX: number;
  deltaY: number;
  moved: boolean;
}
