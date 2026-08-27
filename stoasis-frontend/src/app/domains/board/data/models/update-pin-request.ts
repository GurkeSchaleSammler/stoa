import { UpdateGridBlockRequest } from './update-grid-block-request';
import { LinkPinData } from '../../../../shared/models/link-pin-data';
import { PhotoPinData } from '../../../../shared/models/photo-pin-data';
import { NotePinData } from '../../../../shared/models/note-pin-data';

export interface UpdatePinRequest {
  data?: Partial<LinkPinData | NotePinData | PhotoPinData>;
  color?: string | null;
  tags?: string[];
  sortOrder?: number;
  grid?: UpdateGridBlockRequest;
}
