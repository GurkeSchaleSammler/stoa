export type Plan = 'free' | 'premium';
export type Role = 'owner' | 'editor' | 'viewer';
export type PinType = 'link' | 'note' | 'photo';
export type BoardViewMode = 'board' | 'list';

export interface GridBlock {
  id: string;
  x: number;
  y: number;
  width: 16;
  heightClips: number;
  layer: number;
  contentType: PinType | 'stack';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: Plan;
  createdAt: string;
}

export interface PinComment {
  authorId: string;
  authorName: string;
  body: string;
  at: string;
  pending?: boolean;
}

export interface LinkPinData {
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  readingTimeMin: number | null;
  parseStatus: 'ok' | 'failed' | 'pending';
}

export interface NotePinData {
  content: string;
  color: 'yellow' | 'blue' | 'green';
}

export interface PhotoPinData {
  fileKey: string;
  caption: string | null;
  width: number;
  height: number;
  imageUrl?: string | null;
}

interface PinBase {
  id: string;
  collectionId: string;
  createdBy: string;
  createdByName: string;
  sortOrder: number;
  tags: string[];
  comments: PinComment[];
  createdAt: string;
  grid: GridBlock;
}

export type Pin =
  | (PinBase & { type: 'link'; data: LinkPinData })
  | (PinBase & { type: 'note'; data: NotePinData })
  | (PinBase & { type: 'photo'; data: PhotoPinData });

export function canEdit(role: Role | null): boolean {
  return role === 'owner' || role === 'editor';
}

export function canManage(role: Role | null): boolean {
  return role === 'owner';
}
