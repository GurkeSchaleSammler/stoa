import { User } from '../../../../shared/models/user';

export interface ProfileState {
  user: User | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  success: string | null;
}
