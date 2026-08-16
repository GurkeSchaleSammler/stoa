import { GridBlock } from './grid-block';
import { PinComment } from './pin-comment';

export interface PinBase {
  id: string;
  collectionId: string;
  createdBy: string;
  createdByName: string;
  sortOrder: number;
  tags: string[];
  comments: PinComment[];
  createdAt: string;
  grid: GridBlock;
}
