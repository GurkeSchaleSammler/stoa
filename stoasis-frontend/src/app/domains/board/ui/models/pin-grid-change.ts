import { UpdateGridBlockRequest } from '../../data/models/update-grid-block-request';

export interface PinGridChange {
  pinId: string;
  grid: UpdateGridBlockRequest;
}
