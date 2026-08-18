import { LinkPinData } from './link-pin-data';
import { NotePinData } from './note-pin-data';
import { PhotoPinData } from './photo-pin-data';
import { PinBase } from './pin-base';
import { SkillPinData } from './skill-pin-data';

export type Pin =
  | (PinBase & { type: 'link'; data: LinkPinData })
  | (PinBase & { type: 'note'; data: NotePinData })
  | (PinBase & { type: 'photo'; data: PhotoPinData })
  | (PinBase & { type: 'skill'; data: SkillPinData });
