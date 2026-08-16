export interface InviteInfo {
  collectionId: string;
  token: string;
  url: string;
  visibility: 'private' | 'link';
  collectionName: string;
  alreadyMember?: boolean;
}
