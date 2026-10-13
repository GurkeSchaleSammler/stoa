import { PinType } from '../../../../shared/models/pin-type';
import { Visibility } from './visibility';

export interface PublicCollection {
  id: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
  visibility: Visibility;
  pinCount: number;
  updatedAt: string;
  boardKind: 'WORK' | 'PERSONAL' | null;
}
