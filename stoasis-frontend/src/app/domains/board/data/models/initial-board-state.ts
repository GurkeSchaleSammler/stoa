import { BoardState } from './board-state';
import { initialBoardElements } from './initial-board-elements';

export const initialBoardState: BoardState = {
  pins: [],
  elements: initialBoardElements,
  context: null,
  selectedPinId: null,
  viewMode: 'board',
  status: 'idle',
  error: null,
  isMutating: false,
};
