import { Role } from '../../../../shared/models/role';

export interface MemberSummary {
  userId: string;
  role: Role;
  name: string;
}
