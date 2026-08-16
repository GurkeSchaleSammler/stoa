import { Role } from './role';

export function canManage(role: Role | null): boolean {
  return role === 'owner';
}
