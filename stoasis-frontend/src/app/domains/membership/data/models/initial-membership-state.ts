import { MembershipState } from './membership-state';

export const initialMembershipState: MembershipState = {
  members: [],
  invite: null,
  status: 'idle',
  error: null,
  isMutating: false,
};
