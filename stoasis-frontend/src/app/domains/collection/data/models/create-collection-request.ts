import { PinType } from '../../../../shared/models/pin-type';

export interface CreateCollectionRequest {
  templateId?: string;
  name: string;
  emoji: string;
  allowedTypes: PinType[];
}
