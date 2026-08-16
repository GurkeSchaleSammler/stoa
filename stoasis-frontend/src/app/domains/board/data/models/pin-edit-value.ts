import { NotePinData } from '../../../../shared/models/note-pin-data';

export interface PinEditValue {
  title: string;
  description: string;
  content: string;
  color: NotePinData['color'];
  caption: string;
  tags: string;
}
