import { CollectionState } from './collection-state';

export const initialCollectionState: CollectionState = {
  collections: [],
  activeCollection: null,
  filter: 'all',
  status: 'idle',
  error: null,
  isSaving: false,
};
