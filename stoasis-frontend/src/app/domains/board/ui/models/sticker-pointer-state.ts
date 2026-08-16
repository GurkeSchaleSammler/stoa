import { StickerElement } from '../../data/models/sticker-element';

export interface StickerPointerState {
  pointerId: number;
  stickerId: string;
  mode: 'move' | 'resize' | 'rotate';
  startClientX: number;
  startClientY: number;
  origin: StickerElement;
  current: StickerElement;
  centerX: number;
  centerY: number;
  startAngle: number;
}
