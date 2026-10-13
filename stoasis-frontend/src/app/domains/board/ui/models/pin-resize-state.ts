import { UpdateGridBlockRequest } from '../../data/models/update-grid-block-request';

export type PinResizeEdge = 'left' | 'right' | 'top' | 'bottom';

export interface PinResizeState {
  pointerId: number;
  pinId: string;
  edge: PinResizeEdge;
  startClientX: number;
  startClientY: number;
  origin: UpdateGridBlockRequest;
  grid: UpdateGridBlockRequest;
  baseHeightClips: number;
  moved: boolean;
  invalid: boolean;
}
