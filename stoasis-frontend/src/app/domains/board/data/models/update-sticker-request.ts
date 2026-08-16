import { BoardColorVariant } from './board-color-variant';
import { StickerMotif } from './sticker-motif';

export interface UpdateStickerRequest {
  x?: number;
  y?: number;
  widthClips?: number;
  heightClips?: number;
  rotation?: number;
  layer?: number;
  motif?: StickerMotif;
  colorVariant?: BoardColorVariant;
}
