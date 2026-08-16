import { SearchState } from './search-state';

export const initialSearchState: SearchState = {
  query: '',
  activeFilters: { type: null, tag: null },
  results: [],
  status: 'idle',
  error: null,
};
