import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { StickerElement } from '../data/models/sticker-element';
import { BoardStickerIconComponent } from './board-sticker-icon';
import { StickerPointerState } from './models/sticker-pointer-state';

@Component({
  selector: 'ui-board-sticker',
  standalone: true,
  imports: [AppIconComponent, BoardStickerIconComponent, TranslatePipe],
  template: `
    <div
      class="board-sticker"
      [class]="'board-sticker ' + sticker().colorVariant"
      [class.selected]="selected()"
      [style.left.px]="value().x"
      [style.top.px]="value().y"
      [style.width.px]="value().widthClips * clipSizePx()"
      [style.height.px]="value().heightClips * clipSizePx()"
      [style.transform]="'rotate(' + value().rotation + 'deg)'"
      [style.z-index]="value().layer + 1000"
      (pointerdown)="pointerStart.emit({ event: $event, mode: 'move' })"
      (pointermove)="pointerMove.emit($event)"
      (pointerup)="pointerEnd.emit($event)"
      (pointercancel)="pointerCancel.emit($event)"
      (click)="select.emit()"
    >
      <ui-board-sticker-icon [motif]="sticker().motif" />
      @if (canEdit() && selected()) {
        <div class="sticker-layer-controls">
          <button
            type="button"
            [attr.aria-label]="'board.sendBack' | translate"
            (pointerdown)="$event.stopPropagation()"
            (click)="$event.stopPropagation(); layerChange.emit('back')"
          >
            <ui-app-icon name="arrow-down" />
          </button>
          <button
            type="button"
            [attr.aria-label]="'board.bringFront' | translate"
            (pointerdown)="$event.stopPropagation()"
            (click)="$event.stopPropagation(); layerChange.emit('front')"
          >
            <ui-app-icon name="arrow-up" />
          </button>
        </div>
        <button
          type="button"
          class="sticker-delete"
          [attr.aria-label]="'common.delete' | translate"
          (pointerdown)="$event.stopPropagation()"
          (click)="delete.emit()"
        >
          <ui-app-icon name="close" />
        </button>
        <button
          type="button"
          class="sticker-rotate"
          [attr.aria-label]="'board.rotate' | translate"
          (pointerdown)="pointerStart.emit({ event: $event, mode: 'rotate' })"
          (pointermove)="pointerMove.emit($event)"
          (pointerup)="pointerEnd.emit($event)"
        >
          ↻
        </button>
        <button
          type="button"
          class="sticker-resize"
          [attr.aria-label]="'board.resize' | translate"
          (pointerdown)="pointerStart.emit({ event: $event, mode: 'resize' })"
          (pointermove)="pointerMove.emit($event)"
          (pointerup)="pointerEnd.emit($event)"
        ></button>
      }
    </div>
  `,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardStickerComponent {
  readonly sticker = input.required<StickerElement>();
  readonly value = input.required<StickerElement>();
  readonly selected = input(false);
  readonly canEdit = input(false);
  readonly clipSizePx = input.required<number>();
  readonly pointerStart = output<{ event: PointerEvent; mode: StickerPointerState['mode'] }>();
  readonly pointerMove = output<PointerEvent>();
  readonly pointerEnd = output<PointerEvent>();
  readonly pointerCancel = output<PointerEvent>();
  readonly select = output<void>();
  readonly layerChange = output<'back' | 'front'>();
  readonly delete = output<void>();
}
