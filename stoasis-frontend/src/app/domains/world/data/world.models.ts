import { Visibility } from '../../collection/data/models/visibility';
import { PublicCollection } from '../../collection/data/models/public-collection';
import { Pin } from '../../../shared/models/pin';

export interface WorldSummary {
  id: string;
  name: string;
  emoji: string;
  visibility: Visibility;
  startCollectionId: string;
  boardCount: number;
  updatedAt: string;
}

export interface WorldBoard {
  id: string;
  name: string;
  emoji: string;
  pinCount: number;
  isStart: boolean;
  backlinkCount: number;
}

export interface WorldPortal {
  pinId: string;
  sourceCollectionId: string;
  targetCollectionId: string | null;
  label: string;
  emoji: string;
}

export interface WorldLimits {
  premium: boolean;
  worldCount: number;
  worldLimit: number;
  boardCount: number;
  boardLimit: number;
}

export interface WorldDetail extends WorldSummary {
  ownerId: string;
  shareToken: string | null;
  boards: WorldBoard[];
  portals: WorldPortal[];
  limits: WorldLimits;
}

export interface CreateWorldRequest {
  name: string;
  emoji: string;
  startCollectionId: string;
}

export interface UpdateWorldRequest {
  name?: string;
  emoji?: string;
  startCollectionId?: string;
  visibility?: Visibility;
}

export interface WorldBoardContent {
  collection: PublicCollection;
  pins: Pin[];
}
