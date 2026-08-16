import { Role } from '../../../../shared/models/role';

export interface Member {
  userId: string;
  role: Role;
  name: string;
  email: string;
  avatarUrl: string | null;
}
