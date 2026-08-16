import { BoardState } from './board-state';

export const initialBoardState: BoardState = {
  pins: [],
  context: null,
  selectedPinId: null,
  viewMode: 'board',
  status: 'idle',
  error: null,
  isMutating: false,
};
