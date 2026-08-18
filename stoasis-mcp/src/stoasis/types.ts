export type PinType = "link" | "note" | "photo" | "skill";
export type Role = "owner" | "editor" | "viewer";
export type Visibility = "private" | "link" | "public";
export type BoardColor = "accent" | "sage" | "clay" | "ink" | "amber";
export type StickerMotif =
  | "circle"
  | "triangle"
  | "moon"
  | "blob"
  | "star"
  | "wave"
  | "arrow"
  | "leaf"
  | "cloud"
  | "drop"
  | "compass"
  | "suitcase"
  | "camera";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  plan?: string;
  createdAt?: string;
};

export type AuthResponse = {
  user: User;
  expiresAt: string;
};

export type MemberSummary = {
  userId: string;
  role: Role;
  name: string;
};

export type CollectionSummary = {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: Visibility;
  pinCount: number;
  members: MemberSummary[];
  updatedAt: string;
  boardKind?: "WORK" | "PERSONAL" | null;
  isSystem?: boolean;
};

export type CollectionDetail = CollectionSummary & {
  ownerId: string;
  inviteToken?: string | null;
  currentUserRole?: Role | null;
};

export type GridBlock = {
  id: string;
  x: number;
  y: number;
  width: number;
  heightClips: number;
  layer: number;
  contentType: PinType;
};

export type PinComment = {
  authorId: string;
  authorName: string;
  body: string;
  at: string;
};

export type Pin = {
  id: string;
  collectionId: string;
  createdBy: string;
  createdByName: string;
  sortOrder: number;
  tags: string[];
  comments: PinComment[];
  createdAt: string;
  type: PinType;
  data: Record<string, unknown>;
  grid: GridBlock;
};

export type SearchResult = Omit<Pin, "grid"> & { collectionName: string };

export type StackBlock = {
  id: string;
  type: "stack";
  x: number;
  y: number;
  width: number;
  heightClips: number;
  layer: number;
  children: string[];
  expanded: boolean;
};

export type Connector = {
  id: string;
  sourcePinId: string;
  targetPinId: string;
  colorVariant: BoardColor;
};

export type Zone = {
  id: string;
  type: "zone";
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  colorVariant: BoardColor;
  label?: string | null;
};

export type FloatingLabel = {
  id: string;
  type: "label";
  x: number;
  y: number;
  widthClips: number;
  text: string;
  layer: number;
};

export type Sticker = {
  id: string;
  type: "sticker";
  motif: StickerMotif;
  colorVariant: BoardColor;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  rotation: number;
  layer: number;
};

export type BoardElements = {
  stacks: StackBlock[];
  connectors: Connector[];
  zones: Zone[];
  labels: FloatingLabel[];
  stickers: Sticker[];
};

export type BoardBounds = {
  widthClips: 160;
  heightClips: 240;
  occupied: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

export type BoardSnapshot = {
  board: CollectionDetail & { url: string; canEdit: boolean };
  bounds: BoardBounds;
  pins: Pin[];
  elements: BoardElements;
  relationships: {
    stackByPinId: Record<string, string>;
    unstackedPinIds: string[];
    connectorsByPinId: Record<string, string[]>;
  };
  counts: {
    pins: number;
    stacks: number;
    connectors: number;
    zones: number;
    labels: number;
    stickers: number;
  };
};
