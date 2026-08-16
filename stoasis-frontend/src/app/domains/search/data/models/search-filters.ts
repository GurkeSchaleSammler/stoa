import { PinType } from '../../../../shared/models/pin-type';

export interface SearchFilters {
  type: PinType | null;
  tag: string | null;
}
