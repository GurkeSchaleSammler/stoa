import { BoardMemberSummary } from './board-member-summary';
import { PinType } from '../../../../shared/models/pin-type';
import { Role } from '../../../../shared/models/role';

export interface BoardContext {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: 'private' | 'link';
  currentUserRole: Role | null;
  members: BoardMemberSummary[];
}
