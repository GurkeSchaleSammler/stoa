import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardCanvasStackInteractions } from './board-canvas-stack-interactions';
import { BoardListViewComponent } from './board-list-view';
import { BoardPaletteComponent } from './board-palette';
import { BoardStatusComponent } from './board-status';
import { BoardStickerComponent } from './board-sticker';
import { BoardToolbarComponent } from './board-toolbar';
import { BoardColorPickerComponent } from './board-color-picker';
import { ImageFullViewComponent } from './image-full-view';
import { PinCardComponent } from './pin-card';
import { PinEditButtonComponent } from './pin-edit-button';

@Component({
  selector: 'ui-board-canvas',
  standalone: true,
  imports: [
    AppIconComponent,
    BoardListViewComponent,
    BoardPaletteComponent,
    BoardStatusComponent,
    BoardStickerComponent,
    BoardToolbarComponent,
    BoardColorPickerComponent,
    ImageFullViewComponent,
    PinCardComponent,
    PinEditButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './board-canvas.html',
  styleUrls: ['./board.scss', './board-canvas-extras.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCanvasComponent extends BoardCanvasStackInteractions {}
