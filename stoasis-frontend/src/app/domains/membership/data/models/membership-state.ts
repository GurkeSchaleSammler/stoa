import { InviteInfo } from './invite-info';
import { Member } from './member';

export interface MembershipState {
  members: Member[];
  invite: InviteInfo | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isMutating: boolean;
}
