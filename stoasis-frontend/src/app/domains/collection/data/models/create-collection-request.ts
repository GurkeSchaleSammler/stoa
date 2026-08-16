import { PinType } from '../../../../shared/models/pin-type';

export interface CreateCollectionRequest {
  name: string;
  emoji: string;
  allowedTypes: PinType[];
}
