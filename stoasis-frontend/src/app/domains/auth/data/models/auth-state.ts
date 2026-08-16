import { AuthStatus } from './auth-status';
import { User } from '../../../../shared/models/user';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}
