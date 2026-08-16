import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardCanvasStackInteractions } from './board-canvas-stack-interactions';
import { BoardListViewComponent } from './board-list-view';
import { BoardPaletteComponent } from './board-palette';
import { BoardStatusComponent } from './board-status';
import { BoardStickerComponent } from './board-sticker';
import { BoardToolbarComponent } from './board-toolbar';
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
    PinCardComponent,
    PinEditButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './board-canvas.html',
  styleUrl: './board.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCanvasComponent extends BoardCanvasStackInteractions {}
