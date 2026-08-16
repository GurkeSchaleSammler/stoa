import { BoardColorVariant } from './board-color-variant';

export interface ConnectorThread {
  id: string;
  sourcePinId: string;
  targetPinId: string;
  colorVariant: BoardColorVariant;
}
