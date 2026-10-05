import { Visibility } from './visibility';

export function collectionShareUrl(
  origin: string,
  id: string,
  visibility: Visibility,
  inviteToken: string | null,
): string {
  if (visibility === 'private' || (visibility === 'link' && !inviteToken)) return '';
  const path = `${origin}/shared/collections/${encodeURIComponent(id)}`;
  return visibility === 'link' ? `${path}?token=${encodeURIComponent(inviteToken!)}` : path;
}
