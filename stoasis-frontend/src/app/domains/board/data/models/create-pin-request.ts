import { LinkPinData } from '../../../../shared/models/link-pin-data';
import { PinType } from '../../../../shared/models/pin-type';
import { NotePinData } from '../../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../../shared/models/photo-pin-data';
import { SkillPinData } from '../../../../shared/models/skill-pin-data';
import { PortalPinData } from '../../../../shared/models/portal-pin-data';

export interface CreatePinRequest {
  type: PinType;
  data: LinkPinData | NotePinData | PhotoPinData | PortalPinData | SkillPinData | { url: string };
  color?: string | null;
  tags?: string[];
}
