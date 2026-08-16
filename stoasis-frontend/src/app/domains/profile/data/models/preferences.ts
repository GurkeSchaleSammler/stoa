import { ColorPalette } from './color-palette';
import { ThemeMode } from './theme-mode';
import { BoardViewMode } from '../../../../shared/models/board-view-mode';

export interface Preferences {
  theme: ThemeMode;
  palette: ColorPalette;
  defaultView: BoardViewMode;
}
