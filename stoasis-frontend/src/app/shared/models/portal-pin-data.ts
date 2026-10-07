export interface PortalPinData {
  worldId: string | null;
  targetCollectionId: string | null;
  targetName: string | null;
  targetEmoji: string | null;
  label: string;
  emoji: string;
  available: boolean;
  createReturnPortal?: boolean;
}
