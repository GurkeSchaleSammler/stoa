import { UpdateGridBlockRequest } from '../../data/models/update-grid-block-request';
import { StackTarget } from './stack-target';

export interface DragState {
  pointerId: number;
  pinId: string;
  startClientX: number;
  startClientY: number;
  origin: UpdateGridBlockRequest;
  leftPx: number;
  topPx: number;
  layer: number;
  moved: boolean;
  invalid: boolean;
  stackTarget: StackTarget | null;
}
