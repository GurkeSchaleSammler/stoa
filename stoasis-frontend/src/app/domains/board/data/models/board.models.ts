import {
  BoardViewMode,
  GridBlock,
  LinkPinData,
  NotePinData,
  PhotoPinData,
  Pin,
  PinComment,
  PinType,
  Role,
} from '../../../../shared/models/core.models';

export type {
  BoardViewMode,
  GridBlock,
  LinkPinData,
  NotePinData,
  PhotoPinData,
  Pin,
  PinComment,
  PinType,
} from '../../../../shared/models/core.models';

export interface CreatePinRequest {
  type: PinType;
  data: LinkPinData | NotePinData | PhotoPinData | { url: string };
  tags?: string[];
}

export interface UpdatePinRequest {
  data?: Partial<LinkPinData | NotePinData | PhotoPinData>;
  tags?: string[];
  sortOrder?: number;
  grid?: UpdateGridBlockRequest;
}

export type BoardColorVariant = 'accent' | 'sage' | 'clay' | 'ink' | 'amber';

export interface StackBlock {
  id: string;
  type: 'stack';
  x: number;
  y: number;
  width: 16;
  heightClips: number;
  layer: number;
  children: string[];
  expanded: boolean;
}

export interface ConnectorThread {
  id: string;
  sourcePinId: string;
  targetPinId: string;
  colorVariant: BoardColorVariant;
}

export interface SoftZone {
  id: string;
  type: 'zone';
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  colorVariant: BoardColorVariant;
  label: string | null;
}

export interface FloatingLabel {
  id: string;
  type: 'label';
  x: number;
  y: number;
  widthClips: number;
  text: string;
  layer: number;
}

export type StickerMotif =
  | 'circle'
  | 'triangle'
  | 'moon'
  | 'blob'
  | 'star'
  | 'wave'
  | 'arrow'
  | 'leaf'
  | 'cloud'
  | 'drop'
  | 'compass'
  | 'suitcase'
  | 'camera';

export interface StickerElement {
  id: string;
  type: 'sticker';
  motif: StickerMotif;
  colorVariant: BoardColorVariant;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  rotation: number;
  layer: number;
}

export interface BoardElements {
  stacks: StackBlock[];
  connectors: ConnectorThread[];
  zones: SoftZone[];
  labels: FloatingLabel[];
  stickers: StickerElement[];
}

export interface CreateSoftZoneRequest {
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  colorVariant: BoardColorVariant;
  label?: string | null;
}

export interface CreateFloatingLabelRequest {
  x: number;
  y: number;
  widthClips: number;
  text: string;
  layer: number;
}

export interface CreateStickerRequest {
  motif: StickerMotif;
  colorVariant: BoardColorVariant;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
  rotation: number;
  layer: number;
}

export interface UpdateStickerRequest {
  x?: number;
  y?: number;
  widthClips?: number;
  heightClips?: number;
  rotation?: number;
  layer?: number;
  motif?: StickerMotif;
  colorVariant?: BoardColorVariant;
}

export const initialBoardElements: BoardElements = {
  stacks: [],
  connectors: [],
  zones: [],
  labels: [],
  stickers: [],
};

export type UpdateGridBlockRequest = Pick<GridBlock, 'x' | 'y' | 'heightClips' | 'layer'>;

export const CLIP_SIZE_PX = 14;
export const CARD_WIDTH_CLIPS = 16;
export const BOARD_WIDTH_CLIPS = 160;
export const BOARD_HEIGHT_CLIPS = 240;

export interface GridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function intersectionArea(a: GridRect, b: GridRect): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

export function overlapAllowed(a: GridRect, b: GridRect): boolean {
  const smallerArea = Math.min(a.width * a.height, b.width * b.height);
  return intersectionArea(a, b) <= 0.5 * smallerArea;
}

export interface BoardMemberSummary {
  userId: string;
  role: Role;
  name: string;
}

export interface BoardContext {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: 'private' | 'link';
  currentUserRole: Role | null;
  members: BoardMemberSummary[];
}

export interface BoardState {
  pins: Pin[];
  elements: BoardElements;
  context: BoardContext | null;
  selectedPinId: string | null;
  viewMode: BoardViewMode;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  isMutating: boolean;
}

export interface LinkPreview extends LinkPinData {}

export interface UploadedPhoto {
  fileKey: string;
  imageUrl: string | null;
  width: number;
  height: number;
  originalName: string;
}

export interface AddPinDraft {
  type: PinType | null;
  url: string;
  content: string;
  color: NotePinData['color'];
  caption: string;
  tags: string;
}

export interface PinEditValue {
  title: string;
  description: string;
  content: string;
  color: NotePinData['color'];
  caption: string;
  tags: string;
}

export interface PinMeta {
  createdByName: string;
  createdAt: string;
}

export const initialBoardState: BoardState = {
  pins: [],
  elements: initialBoardElements,
  context: null,
  selectedPinId: null,
  viewMode: 'board',
  status: 'idle',
  error: null,
  isMutating: false,
};
