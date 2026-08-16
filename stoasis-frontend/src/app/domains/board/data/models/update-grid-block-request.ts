import { GridBlock } from '../../../../shared/models/grid-block';

export type UpdateGridBlockRequest = Pick<
  GridBlock,
  'x' | 'y' | 'heightClips' | 'layer'
>;
