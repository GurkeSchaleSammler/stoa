import { SearchFilters } from './search-filters';
import { SearchResult } from './search-result';

export interface SearchState {
  query: string;
  activeFilters: SearchFilters;
  results: SearchResult[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}
