import { PinType } from './pin-type';

export interface GridBlock {
  id: string;
  x: number;
  y: number;
  width: 16;
  heightClips: number;
  layer: number;
  contentType: PinType | 'stack';
}
