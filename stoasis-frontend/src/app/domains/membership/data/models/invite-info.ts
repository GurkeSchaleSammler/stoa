export interface InviteInfo {
  collectionId: string;
  token: string;
  url: string;
  visibility: 'private' | 'link' | 'public';
  collectionName: string;
  alreadyMember?: boolean;
  capacity: {
    memberLimit: number;
    sharedBoardLimit: number;
    ownedSharedBoards: number;
    limitReason: string | null;
  };
}
