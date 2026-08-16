import { BoardColorVariant } from './board-color-variant';
import { StickerMotif } from './sticker-motif';

export interface StickerElement {
  id: string;
  type: 'sticker';
  motif: StickerMotif;
  colorVariant: BoardColorVariant;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  rotation: number;
  layer: number;
}
