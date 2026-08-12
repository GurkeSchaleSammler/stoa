import { Role } from '../../../../shared/models/core.models';
export type { Role } from '../../../../shared/models/core.models';

export interface Member {
  userId: string;
  role: Role;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface InviteInfo {
  collectionId: string;
  token: string;
  url: string;
  visibility: 'private' | 'link';
  collectionName: string;
  alreadyMember?: boolean;
}

export interface UpdateRoleRequest {
  role: Role;
}

export interface MembershipState {
  members: Member[];
  invite: InviteInfo | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isMutating: boolean;
}

export const initialMembershipState: MembershipState = {
  members: [],
  invite: null,
  status: 'idle',
  error: null,
  isMutating: false,
};
