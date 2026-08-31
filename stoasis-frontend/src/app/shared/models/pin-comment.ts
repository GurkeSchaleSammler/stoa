export interface PinComment {
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  at: string;
  pending?: boolean;
}
