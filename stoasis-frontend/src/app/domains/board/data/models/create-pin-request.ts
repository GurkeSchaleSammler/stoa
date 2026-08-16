import { LinkPinData } from '../../../../shared/models/link-pin-data';
import { PinType } from '../../../../shared/models/pin-type';
import { NotePinData } from '../../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../../shared/models/photo-pin-data';

export interface CreatePinRequest {
  type: PinType;
  data: LinkPinData | NotePinData | PhotoPinData | { url: string };
  tags?: string[];
}
