import { Role } from '../../../../shared/models/role';

export interface BoardMemberSummary {
  userId: string;
  role: Role;
  name: string;
}
