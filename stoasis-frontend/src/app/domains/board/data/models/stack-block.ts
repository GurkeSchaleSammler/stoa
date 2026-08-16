export interface StackBlock {
  id: string;
  type: 'stack';
  x: number;
  y: number;
  width: 16;
  heightClips: number;
  layer: number;
  children: string[];
  expanded: boolean;
}
