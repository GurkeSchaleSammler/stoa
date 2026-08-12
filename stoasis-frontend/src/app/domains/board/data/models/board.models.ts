import {
  BoardViewMode,
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
  context: null,
  selectedPinId: null,
  viewMode: 'board',
  status: 'idle',
  error: null,
  isMutating: false,
};
