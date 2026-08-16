import { BoardContext } from './board-context';
import { BoardViewMode } from '../../../../shared/models/board-view-mode';
import { Pin } from '../../../../shared/models/pin';

export interface BoardState {
  pins: Pin[];
  context: BoardContext | null;
  selectedPinId: string | null;
  viewMode: BoardViewMode;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isMutating: boolean;
}
