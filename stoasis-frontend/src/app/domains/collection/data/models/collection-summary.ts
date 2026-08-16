import { MemberSummary } from './member-summary';
import { Visibility } from './visibility';
import { PinType } from '../../../../shared/models/pin-type';

export interface CollectionSummary {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: Visibility;
  pinCount: number;
  members: MemberSummary[];
  updatedAt: string;
}
