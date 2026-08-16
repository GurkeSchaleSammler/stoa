import { CollectionDetail } from './collection-detail';
import { CollectionSummary } from './collection-summary';
import { CollectionFilter } from './collection-filter';

export interface CollectionState {
  collections: CollectionSummary[];
  activeCollection: CollectionDetail | null;
  filter: CollectionFilter;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isSaving: boolean;
}
