import { PinType, Role } from '../../../../shared/models/core.models';

export type Visibility = 'private' | 'link';
export type CollectionFilter = 'all' | 'personal' | 'shared';

export interface MemberSummary {
  userId: string;
  role: Role;
  name: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: Visibility;
  pinCount: number;
  members: MemberSummary[];
  updatedAt: string;
}

export interface CollectionDetail extends CollectionSummary {
  ownerId: string;
  inviteToken: string | null;
  currentUserRole: Role | null;
}

export interface CreateCollectionRequest {
  name: string;
  emoji: string;
  allowedTypes: PinType[];
}

export interface UpdateCollectionRequest {
  name?: string;
  emoji?: string;
  allowedTypes?: PinType[];
  visibility?: Visibility;
}

export interface CollectionState {
  collections: CollectionSummary[];
  activeCollection: CollectionDetail | null;
  filter: CollectionFilter;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isSaving: boolean;
}

export const initialCollectionState: CollectionState = {
  collections: [],
  activeCollection: null,
  filter: 'all',
  status: 'idle',
  error: null,
  isSaving: false,
};
