import { BoardContext } from './board-context';
import { BoardElements } from './board-elements';
import { BoardViewMode } from '../../../../shared/models/board-view-mode';
import { Pin } from '../../../../shared/models/pin';

export interface BoardState {
  pins: Pin[];
  elements: BoardElements;
  context: BoardContext | null;
  selectedPinId: string | null;
  viewMode: BoardViewMode;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isMutating: boolean;
}
