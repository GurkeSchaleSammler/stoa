import { Plan } from './plan';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: Plan;
  createdAt: string;
}
