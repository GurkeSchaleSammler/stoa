import { BoardColorVariant } from './board-color-variant';

export interface CreateSoftZoneRequest {
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  colorVariant: BoardColorVariant;
  label?: string | null;
}
