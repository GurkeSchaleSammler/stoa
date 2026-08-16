import { Role } from './role';

export function canEdit(role: Role | null): boolean {
  return role === 'owner' || role === 'editor';
}
