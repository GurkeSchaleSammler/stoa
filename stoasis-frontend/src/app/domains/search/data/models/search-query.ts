import { PinType } from '../../../../shared/models/pin-type';

export interface SearchQuery {
  q: string;
  type?: PinType;
  tag?: string;
  tags?: string[];
  tagMode?: 'all' | 'any';
  page?: number;
}
