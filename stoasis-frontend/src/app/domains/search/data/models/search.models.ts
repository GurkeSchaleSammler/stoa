import { Pin, PinType } from '../../../../shared/models/core.models';

export type SearchResult = Pin & { collectionId: string; collectionName: string };
export interface SearchQuery {
  q: string;
  type?: PinType;
  tag?: string;
}
export interface Tag {
  id: string;
  name: string;
}
export interface SearchFilters {
  type: PinType | null;
  tag: string | null;
}
export interface SearchState {
  query: string;
  activeFilters: SearchFilters;
  results: SearchResult[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}
export const initialSearchState: SearchState = {
  query: '',
  activeFilters: { type: null, tag: null },
  results: [],
  status: 'idle',
  error: null,
};
