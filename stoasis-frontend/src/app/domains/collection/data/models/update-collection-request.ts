import { Visibility } from './visibility';
import { PinType } from '../../../../shared/models/pin-type';

export interface UpdateCollectionRequest {
  name?: string;
  emoji?: string;
  allowedTypes?: PinType[];
  visibility?: Visibility;
}
