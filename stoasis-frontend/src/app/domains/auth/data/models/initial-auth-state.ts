import { AuthState } from './auth-state';

export const initialAuthState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};
