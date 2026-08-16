import { BoardColorVariant } from './board-color-variant';

export interface SoftZone {
  id: string;
  type: 'zone';
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  colorVariant: BoardColorVariant;
  label: string | null;
}
