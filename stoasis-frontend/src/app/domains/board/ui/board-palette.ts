import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardColorVariant } from '../data/models/board-color-variant';
import { StickerMotif } from '../data/models/sticker-motif';
import { boardColorCssValue } from '../data/models/board-color';
import { BoardColorPickerComponent } from './board-color-picker';
import { BoardTool } from './models/board-tool';

@Component({
  selector: 'ui-board-palette',
  standalone: true,
  imports: [AppIconComponent, FormsModule, TranslatePipe, BoardColorPickerComponent],
  template: `
    <aside class="board-palette" [attr.aria-label]="'board.decorate' | translate">
      <div class="palette-heading">
        <div>
          <p>{{ 'board.paletteEyebrow' | translate }}</p>
          <strong>{{ 'board.paletteTitle' | translate }}</strong>
        </div>
        <button
          type="button"
          class="toolbar-icon"
          [attr.aria-label]="'common.close' | translate"
          (click)="close.emit()"
        >
          <ui-app-icon name="close" />
        </button>
      </div>
      <div class="palette-section">
        <span>{{ 'board.grouping' | translate }}</span>
        <input
          class="zone-label-input"
          maxlength="80"
          [placeholder]="'board.zoneLabelPlaceholder' | translate"
          [ngModel]="zoneLabel()"
          (ngModelChange)="zoneLabelChange.emit($event)"
        />
        <button
          type="button"
          class="palette-tool"
          [class.active]="activeTool() === 'zone'"
          (click)="zoneToolToggle.emit()"
        >
          <ui-app-icon name="layers" /> {{ 'board.drawZone' | translate }}
        </button>
        <ui-board-color-picker
          labelKey="board.elementColor"
          [compact]="true"
          [value]="selectedColor()"
          (valueChange)="colorChange.emit($event)"
        />
      </div>
      <div class="palette-section label-creator">
        <span>{{ 'board.annotation' | translate }}</span>
        <input
          maxlength="120"
          [placeholder]="'board.annotationPlaceholder' | translate"
          [ngModel]="labelText()"
          (ngModelChange)="labelTextChange.emit($event)"
        />
        <button
          type="button"
          class="palette-tool"
          [disabled]="!labelText().trim()"
          (click)="addLabel.emit()"
        >
          <ui-app-icon name="plus" /> {{ 'common.add' | translate }}
        </button>
      </div>
      <div class="palette-section sticker-palette">
        <span>{{ 'board.stickers' | translate }}</span>
        <div class="sticker-options">
          @for (motif of stickerMotifs(); track motif) {
            <button
              type="button"
              draggable="true"
              [attr.aria-label]="'board.sticker.' + motif | translate"
              (dragstart)="startStickerDrag($event, motif)"
              (click)="addSticker.emit(motif)"
            >
              <span class="sticker-mini" [style.--decor-color]="colorCssValue(selectedColor())">
                {{ stickerGlyph(motif) }}
              </span>
            </button>
          }
        </div>
        <small>{{ 'board.stickerHint' | translate }}</small>
      </div>
    </aside>
  `,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPaletteComponent {
  readonly activeTool = input<BoardTool>(null);
  readonly selectedColor = input.required<BoardColorVariant>();
  readonly zoneLabel = input('');
  readonly labelText = input('');
  readonly stickerMotifs = input.required<StickerMotif[]>();
  readonly close = output<void>();
  readonly zoneToolToggle = output<void>();
  readonly colorChange = output<BoardColorVariant>();
  readonly zoneLabelChange = output<string>();
  readonly labelTextChange = output<string>();
  readonly addLabel = output<void>();
  readonly addSticker = output<StickerMotif>();

  colorCssValue(color: string): string {
    return boardColorCssValue(color);
  }

  startStickerDrag(event: DragEvent, motif: StickerMotif): void {
    event.dataTransfer?.setData('application/x-stoasis-sticker', motif);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  stickerGlyph(motif: StickerMotif): string {
    const glyphs: Record<StickerMotif, string> = {
      circle: '●',
      triangle: '▲',
      moon: '◐',
      blob: '✦',
      star: '★',
      wave: '≈',
      arrow: '↗',
      leaf: '◆',
      cloud: '☁',
      drop: '●',
      compass: '✣',
      suitcase: '▣',
      camera: '◉',
    };
    return glyphs[motif];
  }
}
