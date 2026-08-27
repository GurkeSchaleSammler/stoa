import { PinType } from '../../../../shared/models/pin-type';
import { NotePinData } from '../../../../shared/models/note-pin-data';

export interface AddPinDraft {
  type: PinType | null;
  url: string;
  content: string;
  color: NotePinData['color'];
  pinColor: string | null;
  caption: string;
  tags: string;
}
