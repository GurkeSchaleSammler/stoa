import { Pin } from './pin';

export type SearchResult = Pin & {
  collectionId: string;
  collectionName: string;
};
