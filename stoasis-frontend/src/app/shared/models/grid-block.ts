import { PinType } from './pin-type';

export interface GridBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  heightClips: number;
  baseHeightClips?: number;
  manualSize?: boolean;
  layer: number;
  contentType: PinType | 'stack';
}
