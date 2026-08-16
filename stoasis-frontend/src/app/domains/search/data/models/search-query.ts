import { PinType } from '../../../../shared/models/pin-type';

export interface SearchQuery {
  q: string;
  type?: PinType;
  tag?: string;
}
