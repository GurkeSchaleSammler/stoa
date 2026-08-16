import { User } from '../../../../shared/models/user';

export interface AuthResponse {
  user: User;
  expiresAt: string;
}
