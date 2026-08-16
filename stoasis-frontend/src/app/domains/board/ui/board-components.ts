import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent, AppIconName } from '../../../shared/ui/app-icon';
import { Pin } from '../../../shared/models/pin';
import { UpdateGridBlockRequest } from '../data/models/update-grid-block-request';
import { StickerElement } from '../data/models/sticker-element';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { PinMeta } from '../data/models/pin-meta';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { BoardElements } from '../data/models/board-elements';
import { BoardContext } from '../data/models/board-context';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { StackBlock } from '../data/models/stack-block';
import { BoardColorVariant } from '../data/models/board-color-variant';
import { CreateSoftZoneRequest } from '../data/models/create-soft-zone-request';
import { CreateFloatingLabelRequest } from '../data/models/create-floating-label-request';
import { CreateStickerRequest } from '../data/models/create-sticker-request';
import { UpdateStickerRequest } from '../data/models/update-sticker-request';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { CARD_WIDTH_CLIPS } from '../data/models/card-width-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { StickerMotif } from '../data/models/sticker-motif';
import { SoftZone } from '../data/models/soft-zone';
import { FloatingLabel } from '../data/models/floating-label';
import { ConnectorThread } from '../data/models/connector-thread';
import { GridRect } from '../data/models/grid-rect';
import { intersectionArea } from '../data/models/intersection-area';
import { overlapAllowed } from '../data/models/overlap-allowed';
import { GridBlock } from '../../../shared/models/grid-block';
import { PinType } from '../../../shared/models/pin-type';
import { AddPinDraft } from '../data/models/add-pin-draft';
import { LinkPreview } from '../data/models/link-preview';
import { PinEditValue } from '../data/models/pin-edit-value';

export interface PinGridChange {
  pinId: string;
  grid: UpdateGridBlockRequest;
}

export interface StackDrop {
  pinId: string;
  targetId: string;
  targetType: 'pin' | 'stack';
}

export interface StackChildRelease {
  stackId: string;
  pinId: string;
  x: number;
  y: number;
  layer: number;
}

type BoardTool = 'zone' | null;

interface StackTarget {
  id: string;
  type: 'pin' | 'stack';
}

interface DragState {
  pointerId: number;
  pinId: string;
  startClientX: number;
  startClientY: number;
  origin: UpdateGridBlockRequest;
  leftPx: number;
  topPx: number;
  layer: number;
  moved: boolean;
  invalid: boolean;
  stackTarget: StackTarget | null;
}

interface StackDragState {
  pointerId: number;
  stackId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  leftPx: number;
  topPx: number;
  layer: number;
  moved: boolean;
  invalid: boolean;
}

interface StackChildDragState {
  pointerId: number;
  stackId: string;
  pinId: string;
  startClientX: number;
  startClientY: number;
  deltaX: number;
  deltaY: number;
  moved: boolean;
}

interface ZonePointerState {
  pointerId: number;
  zoneId: string | null;
  mode: 'draw' | 'move' | 'resize';
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  widthClips: number;
  heightClips: number;
}

interface LabelPointerState {
  pointerId: number;
  labelId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
}

interface StickerPointerState {
  pointerId: number;
  stickerId: string;
  mode: 'move' | 'resize' | 'rotate';
  startClientX: number;
  startClientY: number;
  origin: StickerElement;
  current: StickerElement;
  centerX: number;
  centerY: number;
  startAngle: number;
}

interface ConnectorDraft {
  pointerId: number;
  sourcePinId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  boardLeft: number;
  boardTop: number;
}

@Component({
  selector: 'ui-link-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="link-visual">
      @if (data().imageUrl) {
        <img
          [src]="data().imageUrl"
          alt=""
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      } @else {
        <ui-app-icon name="link" />
      }
    </div>
    <div class="pin-body">
      <p class="pin-kicker">
        {{ data().siteName || ('pin.webLink' | translate) }}
        @if (data().readingTimeMin) {
          · {{ 'pin.readingTime' | translate: { minutes: data().readingTimeMin } }}
        }
      </p>
      <h2>{{ data().title || data().url }}</h2>
      @if (data().description) {
        <p class="pin-description">{{ data().description }}</p>
      }
    </div>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPinComponent {
  readonly data = input.required<LinkPinData>();
  readonly meta = input.required<PinMeta>();
}

@Component({
  selector: 'ui-note-pin',
  standalone: true,
  template: `<div class="note-visual" [class]="'note-visual ' + data().color">
    <p>{{ data().content }}</p>
  </div>`,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePinComponent {
  readonly data = input.required<NotePinData>();
  readonly meta = input.required<PinMeta>();
}

@Component({
  selector: 'ui-photo-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="photo-visual">
      @if (data().imageUrl) {
        <img [src]="data().imageUrl" [alt]="data().caption || ('pin.photoPin' | translate)" />
      } @else {
        <ui-app-icon name="image" />
      }
    </div>
    @if (data().caption) {
      <div class="pin-body">
        <h2>{{ data().caption }}</h2>
      </div>
    }
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPinComponent {
  readonly data = input.required<PhotoPinData>();
  readonly meta = input.required<PinMeta>();
}

@Component({
  selector: 'ui-pin-card',
  standalone: true,
  imports: [LinkPinComponent, NotePinComponent, PhotoPinComponent, AppIconComponent],
  template: `
    <button
      type="button"
      class="pin-card"
      [class.selected]="selected()"
      (click)="onOpen.emit(pin().id)"
    >
      <span class="pin-type" [class]="'pin-type ' + pin().type">
        <ui-app-icon
          [name]="pin().type === 'link' ? 'link' : pin().type === 'note' ? 'note' : 'image'"
        />
      </span>
      @switch (pin().type) {
        @case ('link') {
          <ui-link-pin [data]="linkData()!" [meta]="meta()" />
        }
        @case ('note') {
          <ui-note-pin [data]="noteData()!" [meta]="meta()" />
        }
        @case ('photo') {
          <ui-photo-pin [data]="photoData()!" [meta]="meta()" />
        }
      }
      <footer class="pin-footer">
        <span>{{ pin().createdByName }}</span
        ><time [attr.datetime]="pin().createdAt">{{ pin().createdAt.slice(0, 10) }}</time>
      </footer>
    </button>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinCardComponent {
  readonly pin = input.required<Pin>();
  readonly selected = input(false);
  readonly onOpen = output<string>();
  readonly meta = computed<PinMeta>(() => ({
    createdByName: this.pin().createdByName,
    createdAt: this.pin().createdAt,
  }));
  readonly linkData = computed(() =>
    this.pin().type === 'link' ? (this.pin().data as LinkPinData) : null,
  );
  readonly noteData = computed(() =>
    this.pin().type === 'note' ? (this.pin().data as NotePinData) : null,
  );
  readonly photoData = computed(() =>
    this.pin().type === 'photo' ? (this.pin().data as PhotoPinData) : null,
  );
}

@Component({
  selector: 'ui-board-list-view',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="list-view">
      @for (pin of pins(); track pin.id) {
        <button type="button" class="pin-row" (click)="onSelectPin.emit(pin.id)">
          <span class="row-type">
            <ui-app-icon
              [name]="pin.type === 'link' ? 'link' : pin.type === 'note' ? 'note' : 'image'"
            />
          </span>
          <span class="row-content">
            <strong>
              @switch (pin.type) {
                @case ('link') {
                  {{ pin.data.title }}
                }
                @case ('note') {
                  {{ pin.data.content }}
                }
                @case ('photo') {
                  {{ pin.data.caption || ('pin.photo' | translate) }}
                }
              }
            </strong>
            <small
              >{{ pin.createdByName }} ·
              {{ pin.tags.join(', ') || ('pin.withoutTags' | translate) }}</small
            >
          </span>
          <ui-app-icon name="chevron-right" />
        </button>
      }
    </div>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardListViewComponent {
  readonly pins = input.required<Pin[]>();
  readonly onSelectPin = output<string>();
}

@Component({
  selector: 'ui-board-canvas',
  standalone: true,
  imports: [PinCardComponent, BoardListViewComponent, FormsModule, TranslatePipe, AppIconComponent],
  template: `
    <section class="board-shell">
      @if (context(); as active) {
        <header class="board-toolbar">
          <div class="board-heading">
            <span class="board-emoji">{{ active.emoji }}</span>
            <div>
              <p>{{ 'board.title' | translate }}</p>
              <h1>{{ active.name }}</h1>
            </div>
            <span class="member-count">
              {{ 'membership.personCount' | translate: { count: active.members.length } }}
            </span>
          </div>
          <div class="board-actions">
            <div class="view-toggle" role="group" [attr.aria-label]="'board.view' | translate">
              <button
                type="button"
                [class.active]="viewMode() === 'board'"
                (click)="onViewModeChange.emit('board')"
                [attr.aria-label]="'board.boardView' | translate"
              >
                <ui-app-icon name="grid" />
              </button>
              <button
                type="button"
                [class.active]="viewMode() === 'list'"
                (click)="onViewModeChange.emit('list')"
                [attr.aria-label]="'board.listView' | translate"
              >
                <ui-app-icon name="list" />
              </button>
            </div>
            <button type="button" class="toolbar-button" (click)="onMembersClick.emit()">
              <ui-app-icon name="user-plus" /> {{ 'common.person' | translate }}
            </button>
            @if (canEdit()) {
              <button
                type="button"
                class="toolbar-button decorate-button"
                [class.active]="paletteOpen()"
                (click)="paletteOpen.update((open) => !open)"
              >
                <ui-app-icon name="sparkles" /> {{ 'board.decorate' | translate }}
              </button>
              <button
                type="button"
                class="toolbar-icon"
                [attr.aria-label]="'common.settings' | translate"
                (click)="onSettingsClick.emit()"
              >
                <ui-app-icon name="settings" />
              </button>
            }
          </div>
        </header>
        @if (paletteOpen() && canEdit()) {
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
                (click)="paletteOpen.set(false)"
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
                [ngModel]="newZoneLabel()"
                (ngModelChange)="newZoneLabel.set($event)"
              />
              <button
                type="button"
                class="palette-tool"
                [class.active]="activeTool() === 'zone'"
                (click)="toggleZoneTool()"
              >
                <ui-app-icon name="layers" /> {{ 'board.drawZone' | translate }}
              </button>
              <div class="palette-colors">
                @for (color of colorVariants; track color) {
                  <button
                    type="button"
                    class="color-dot"
                    [class]="'color-dot ' + color"
                    [class.active]="selectedColor() === color"
                    [attr.aria-label]="'board.color.' + color | translate"
                    (click)="selectedColor.set(color)"
                  ></button>
                }
              </div>
            </div>
            <div class="palette-section label-creator">
              <span>{{ 'board.annotation' | translate }}</span>
              <input
                maxlength="120"
                [placeholder]="'board.annotationPlaceholder' | translate"
                [ngModel]="newLabelText()"
                (ngModelChange)="newLabelText.set($event)"
              />
              <button
                type="button"
                class="palette-tool"
                [disabled]="!newLabelText().trim()"
                (click)="addFloatingLabel()"
              >
                <ui-app-icon name="plus" /> {{ 'common.add' | translate }}
              </button>
            </div>
            <div class="palette-section sticker-palette">
              <span>{{ 'board.stickers' | translate }}</span>
              <div class="sticker-options">
                @for (motif of stickerMotifs; track motif) {
                  <button
                    type="button"
                    draggable="true"
                    [attr.aria-label]="'board.sticker.' + motif | translate"
                    (dragstart)="startPaletteStickerDrag($event, motif)"
                    (click)="addSticker(motif)"
                  >
                    <span class="sticker-mini" [class]="'sticker-mini ' + selectedColor()">
                      {{ stickerGlyph(motif) }}
                    </span>
                  </button>
                }
              </div>
              <small>{{ 'board.stickerHint' | translate }}</small>
            </div>
          </aside>
        }
        <div class="board-hint">
          {{ 'board.allowed' | translate }}:
          @for (type of active.allowedTypes; track type; let last = $last) {
            {{ 'pin.type.' + type | translate }}{{ last ? '' : ', ' }}
          }
          · {{ 'board.yourRole' | translate }}:
          {{ 'role.' + (active.currentUserRole || 'guest') | translate }}
        </div>
      }

      @if (error()) {
        <div class="board-error" role="alert">{{ error() | translate }}</div>
      }
      @if (isLoading()) {
        <div class="board-loading" [attr.aria-label]="'board.loading' | translate">
          <span></span><span></span><span></span>
        </div>
      } @else {
        <div class="board-canvas">
          @if (viewMode() === 'board') {
            <div
              #clipBoard
              class="clip-board"
              [style.width.px]="boardWidthPx"
              [style.height.px]="boardHeightPx"
              [class.drawing-zone]="activeTool() === 'zone'"
              (pointerdown)="startBoardPointer($event)"
              (pointermove)="moveBoardPointer($event)"
              (pointerup)="endBoardPointer($event)"
              (pointercancel)="cancelBoardPointer($event)"
              (dragover)="$event.preventDefault()"
              (drop)="dropPaletteSticker($event)"
            >
              @for (zone of elements().zones; track zone.id) {
                <section
                  class="soft-zone"
                  [class]="'soft-zone ' + zone.colorVariant"
                  [style.left.px]="zoneX(zone) * clipSizePx"
                  [style.top.px]="zoneY(zone) * clipSizePx"
                  [style.width.px]="zoneWidth(zone) * clipSizePx"
                  [style.height.px]="zoneHeight(zone) * clipSizePx"
                  (pointerdown)="startZonePointer($event, zone, 'move')"
                  (pointermove)="moveBoardPointer($event)"
                  (pointerup)="endBoardPointer($event)"
                >
                  @if (zone.label) {
                    <span>{{ zone.label }}</span>
                  }
                  @if (canEdit()) {
                    <button
                      type="button"
                      class="element-delete"
                      [attr.aria-label]="'common.delete' | translate"
                      (pointerdown)="$event.stopPropagation()"
                      (click)="onDeleteZone.emit(zone.id)"
                    >
                      <ui-app-icon name="close" />
                    </button>
                    <button
                      type="button"
                      class="zone-resize"
                      [attr.aria-label]="'board.resize' | translate"
                      (pointerdown)="startZonePointer($event, zone, 'resize')"
                      (pointermove)="moveBoardPointer($event)"
                      (pointerup)="endBoardPointer($event)"
                    ></button>
                  }
                </section>
              }

              @if (zonePointer(); as drawing) {
                @if (drawing.mode === 'draw') {
                  <div
                    class="soft-zone zone-draft"
                    [class]="'soft-zone zone-draft ' + selectedColor()"
                    [style.left.px]="drawing.x * clipSizePx"
                    [style.top.px]="drawing.y * clipSizePx"
                    [style.width.px]="drawing.widthClips * clipSizePx"
                    [style.height.px]="drawing.heightClips * clipSizePx"
                  ></div>
                }
              }

              <svg
                class="connector-layer"
                [attr.width]="boardWidthPx"
                [attr.height]="boardHeightPx"
                aria-hidden="true"
              >
                @for (connector of elements().connectors; track connector.id) {
                  <path
                    class="connector-thread"
                    [class]="'connector-thread ' + connector.colorVariant"
                    [attr.d]="connectorPath(connector)"
                    (dblclick)="canEdit() && onDeleteConnector.emit(connector.id)"
                  />
                }
                @if (connectorDraft(); as draft) {
                  <path class="connector-thread draft" [attr.d]="draftConnectorPath(draft)" />
                }
              </svg>

              @for (sticker of elements().stickers; track sticker.id) {
                <div
                  class="board-sticker"
                  [class]="'board-sticker ' + sticker.colorVariant"
                  [class.selected]="selectedStickerId() === sticker.id"
                  [style.left.px]="stickerValue(sticker).x"
                  [style.top.px]="stickerValue(sticker).y"
                  [style.width.px]="stickerValue(sticker).widthClips * clipSizePx"
                  [style.height.px]="stickerValue(sticker).heightClips * clipSizePx"
                  [style.transform]="'rotate(' + stickerValue(sticker).rotation + 'deg)'"
                  [style.z-index]="stickerValue(sticker).layer + 1000"
                  (pointerdown)="startStickerPointer($event, sticker, 'move')"
                  (pointermove)="moveStickerPointer($event)"
                  (pointerup)="endStickerPointer($event)"
                  (pointercancel)="cancelStickerPointer($event)"
                  (click)="selectedStickerId.set(sticker.id)"
                >
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    @switch (sticker.motif) {
                      @case ('circle') {
                        <circle cx="50" cy="50" r="39" />
                      }
                      @case ('triangle') {
                        <path d="M50 10 91 85H9Z" />
                      }
                      @case ('moon') {
                        <path d="M69 13a39 39 0 1 0 17 64A33 33 0 0 1 69 13Z" />
                      }
                      @case ('blob') {
                        <path d="M82 20c17 18 7 57-18 70-24 12-58-3-57-30C7 31 59-5 82 20Z" />
                      }
                      @case ('star') {
                        <path d="m50 8 11 28 30 2-23 19 8 30-26-17-26 17 8-30L9 38l30-2Z" />
                      }
                      @case ('wave') {
                        <path
                          class="outline"
                          d="M5 37c14-23 27 23 44 0s29 23 46 0M5 64c14-23 27 23 44 0s29 23 46 0"
                        />
                      }
                      @case ('arrow') {
                        <path class="outline" d="M10 75c28-4 45-21 64-48M55 21l24 1-4 24" />
                      }
                      @case ('leaf') {
                        <path d="M86 13C48 15 17 34 16 64c0 17 14 25 28 19 27-11 36-42 42-70Z" />
                        <path class="cut" d="M25 75c17-20 31-31 50-48" />
                      }
                      @case ('cloud') {
                        <path d="M24 78h56c23 0 24-34 2-37C78 17 43 15 35 39 9 35 3 72 24 78Z" />
                      }
                      @case ('drop') {
                        <path d="M50 7S19 44 19 65a31 31 0 0 0 62 0C81 44 50 7 50 7Z" />
                      }
                      @case ('compass') {
                        <circle class="outline" cx="50" cy="50" r="40" />
                        <path d="m63 27-8 28-28 8 18-18Z" />
                      }
                      @case ('suitcase') {
                        <rect x="13" y="29" width="74" height="58" rx="14" />
                        <path class="outline" d="M37 29v-9h26v9M31 29v58M69 29v58" />
                      }
                      @case ('camera') {
                        <rect x="9" y="27" width="82" height="59" rx="13" />
                        <circle class="cut" cx="50" cy="57" r="17" />
                        <path class="outline" d="m33 27 7-12h20l7 12" />
                      }
                    }
                  </svg>
                  @if (canEdit() && selectedStickerId() === sticker.id) {
                    <div class="sticker-layer-controls">
                      <button
                        type="button"
                        [attr.aria-label]="'board.sendBack' | translate"
                        (pointerdown)="$event.stopPropagation()"
                        (click)="$event.stopPropagation(); setStickerLayer(sticker, 'back')"
                      >
                        <ui-app-icon name="arrow-down" />
                      </button>
                      <button
                        type="button"
                        [attr.aria-label]="'board.bringFront' | translate"
                        (pointerdown)="$event.stopPropagation()"
                        (click)="$event.stopPropagation(); setStickerLayer(sticker, 'front')"
                      >
                        <ui-app-icon name="arrow-up" />
                      </button>
                    </div>
                    <button
                      type="button"
                      class="sticker-delete"
                      [attr.aria-label]="'common.delete' | translate"
                      (pointerdown)="$event.stopPropagation()"
                      (click)="onDeleteSticker.emit(sticker.id)"
                    >
                      <ui-app-icon name="close" />
                    </button>
                    <button
                      type="button"
                      class="sticker-rotate"
                      [attr.aria-label]="'board.rotate' | translate"
                      (pointerdown)="startStickerPointer($event, sticker, 'rotate')"
                      (pointermove)="moveStickerPointer($event)"
                      (pointerup)="endStickerPointer($event)"
                    >
                      ↻
                    </button>
                    <button
                      type="button"
                      class="sticker-resize"
                      [attr.aria-label]="'board.resize' | translate"
                      (pointerdown)="startStickerPointer($event, sticker, 'resize')"
                      (pointermove)="moveStickerPointer($event)"
                      (pointerup)="endStickerPointer($event)"
                    ></button>
                  }
                </div>
              }

              @for (label of elements().labels; track label.id) {
                <div
                  class="floating-label"
                  [style.left.px]="labelValue(label).x * clipSizePx"
                  [style.top.px]="labelValue(label).y * clipSizePx"
                  [style.width.px]="label.widthClips * clipSizePx"
                  [style.z-index]="label.layer + 2000"
                  (pointerdown)="startLabelPointer($event, label)"
                  (pointermove)="moveLabelPointer($event)"
                  (pointerup)="endLabelPointer($event)"
                  (pointercancel)="cancelLabelPointer($event)"
                >
                  <span>{{ label.text }}</span>
                  @if (canEdit()) {
                    <button
                      type="button"
                      [attr.aria-label]="'common.delete' | translate"
                      (pointerdown)="$event.stopPropagation()"
                      (click)="onDeleteLabel.emit(label.id)"
                    >
                      <ui-app-icon name="close" />
                    </button>
                  }
                </div>
              }

              @for (stack of elements().stacks; track stack.id) {
                <div
                  class="stack-block"
                  [class.expanded]="stack.expanded"
                  [class.drop-target]="isStackTarget('stack', stack.id)"
                  [class.dragging]="stackDrag()?.stackId === stack.id && stackDrag()?.moved"
                  [style.left.px]="stackLeft(stack)"
                  [style.top.px]="stackTop(stack)"
                  [style.width.px]="cardWidthPx"
                  [style.height.px]="stack.heightClips * clipSizePx"
                  [style.z-index]="stackLayer(stack)"
                  (pointerdown)="startStackPointer($event, stack)"
                  (pointermove)="moveStackPointer($event)"
                  (pointerup)="endStackPointer($event, stack)"
                  (pointercancel)="cancelStackPointer($event)"
                >
                  <span class="stack-sheet sheet-one"></span>
                  <span class="stack-sheet sheet-two"></span>
                  @if (stack.expanded) {
                    @for (childId of stack.children; track childId; let index = $index) {
                      @if (pinById(childId); as child) {
                        <div
                          class="stack-child"
                          [attr.data-pin-id]="child.id"
                          [class.dragging-out]="stackChildDrag()?.pinId === childId"
                          [style.--stack-index]="index"
                          [style.transform]="stackChildTransform(stack, childId, index)"
                          (pointerdown)="startStackChildPointer($event, stack, child)"
                          (pointermove)="moveStackChildPointer($event)"
                          (pointerup)="endStackChildPointer($event, stack, child)"
                          (pointercancel)="cancelStackChildPointer($event)"
                        >
                          <ui-pin-card [pin]="child" (onOpen)="openPin($event)" />
                        </div>
                      }
                    }
                  } @else if (topPin(stack); as top) {
                    <div class="stack-child top-card" [attr.data-pin-id]="top.id">
                      <ui-pin-card [pin]="top" (onOpen)="openPin($event)" />
                    </div>
                  }
                  <button
                    type="button"
                    class="stack-badge"
                    [attr.aria-label]="'board.toggleStack' | translate"
                    (pointerdown)="$event.stopPropagation()"
                    (click)="
                      onStackChange.emit({ id: stack.id, update: { expanded: !stack.expanded } })
                    "
                  >
                    +{{ stack.children.length }}
                  </button>
                  @if (canEdit()) {
                    <button
                      type="button"
                      class="stack-dissolve"
                      [attr.aria-label]="'board.dissolveStack' | translate"
                      (pointerdown)="$event.stopPropagation()"
                      (click)="onDissolveStack.emit(stack.id)"
                    >
                      <ui-app-icon name="close" />
                    </button>
                  }
                </div>
              }

              @for (pin of visiblePins(); track pin.id) {
                <div
                  #clipCard
                  class="clip-card"
                  [class.can-move]="canEdit()"
                  [class.dragging]="isDragging(pin.id)"
                  [class.overlap-warning]="isInvalidDrag(pin.id)"
                  [class.drop-rejected]="rejectedPinId() === pin.id"
                  [class.drop-target]="isStackTarget('pin', pin.id)"
                  [attr.data-pin-id]="pin.id"
                  [style.left.px]="cardLeft(pin)"
                  [style.top.px]="cardTop(pin)"
                  [style.width.px]="cardWidthPx"
                  [style.height.px]="cardHeight(pin)"
                  [style.z-index]="cardLayer(pin)"
                  [style.--layer-depth]="layerDepth(pin)"
                  [style.--layer-shadow-y]="layerShadowY(pin)"
                  [style.--layer-shadow-blur]="layerShadowBlur(pin)"
                  (pointerdown)="startDrag($event, pin)"
                  (pointermove)="moveDrag($event)"
                  (pointerup)="endDrag($event)"
                  (pointercancel)="cancelDrag($event)"
                >
                  <ui-pin-card
                    [pin]="pin"
                    [selected]="selectedPinId() === pin.id"
                    (onOpen)="openPin($event)"
                  />
                  @if (canEdit()) {
                    <button
                      type="button"
                      class="connect-handle"
                      [attr.aria-label]="'board.connect' | translate"
                      (pointerdown)="startConnector($event, pin)"
                      (pointermove)="moveConnector($event)"
                      (pointerup)="endConnector($event)"
                      (pointercancel)="cancelConnector($event)"
                    ></button>
                  }
                </div>
              }
              @if (canEdit()) {
                <button
                  type="button"
                  class="add-pin-card"
                  [style.left.px]="addPosition().x * clipSizePx"
                  [style.top.px]="addPosition().y * clipSizePx"
                  [style.width.px]="cardWidthPx"
                  (click)="onAddPinClick.emit()"
                >
                  <span aria-hidden="true"><ui-app-icon name="plus" /></span
                  ><strong>{{ 'pin.add' | translate }}</strong
                  ><small>{{ 'pin.addTypes' | translate }}</small>
                </button>
              }
            </div>
          } @else {
            <ui-board-list-view [pins]="pins()" (onSelectPin)="onSelectPin.emit($event)" />
          }
          @if (pins().length === 0 && !canEdit()) {
            <p class="empty-board">{{ 'board.empty' | translate }}</p>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCanvasComponent {
  readonly pins = input.required<Pin[]>();
  readonly elements = input.required<BoardElements>();
  readonly context = input<BoardContext | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly selectedPinId = input<string | null>(null);
  readonly canEdit = input(false);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly onSelectPin = output<string>();
  readonly onAddPinClick = output<void>();
  readonly onGridChange = output<PinGridChange>();
  readonly onStackDrop = output<StackDrop>();
  readonly onStackChange = output<{
    id: string;
    update: Partial<Pick<StackBlock, 'x' | 'y' | 'layer' | 'expanded'>>;
  }>();
  readonly onReleaseStackChild = output<StackChildRelease>();
  readonly onDissolveStack = output<string>();
  readonly onCreateConnector = output<{
    sourcePinId: string;
    targetPinId: string;
    color: BoardColorVariant;
  }>();
  readonly onDeleteConnector = output<string>();
  readonly onCreateZone = output<CreateSoftZoneRequest>();
  readonly onUpdateZone = output<{ id: string; update: Partial<CreateSoftZoneRequest> }>();
  readonly onDeleteZone = output<string>();
  readonly onCreateLabel = output<CreateFloatingLabelRequest>();
  readonly onUpdateLabel = output<{ id: string; update: Partial<CreateFloatingLabelRequest> }>();
  readonly onDeleteLabel = output<string>();
  readonly onCreateSticker = output<CreateStickerRequest>();
  readonly onUpdateSticker = output<{ id: string; update: UpdateStickerRequest }>();
  readonly onDeleteSticker = output<string>();
  readonly onViewModeChange = output<BoardViewMode>();
  readonly onMembersClick = output<void>();
  readonly onSettingsClick = output<void>();

  readonly clipSizePx = CLIP_SIZE_PX;
  readonly cardWidthPx = CARD_WIDTH_CLIPS * CLIP_SIZE_PX;
  readonly boardWidthPx = BOARD_WIDTH_CLIPS * CLIP_SIZE_PX;
  readonly boardHeightPx = BOARD_HEIGHT_CLIPS * CLIP_SIZE_PX;
  readonly rejectedPinId = signal<string | null>(null);
  readonly paletteOpen = signal(false);
  readonly activeTool = signal<BoardTool>(null);
  readonly selectedColor = signal<BoardColorVariant>('sage');
  readonly newZoneLabel = signal('');
  readonly newLabelText = signal('');
  readonly selectedStickerId = signal<string | null>(null);
  readonly zonePointer = signal<ZonePointerState | null>(null);
  readonly stackDrag = signal<StackDragState | null>(null);
  readonly stackChildDrag = signal<StackChildDragState | null>(null);
  readonly connectorDraft = signal<ConnectorDraft | null>(null);
  readonly visiblePins = computed(() => {
    const stacked = new Set(this.elements().stacks.flatMap((stack) => stack.children));
    return this.pins().filter((pin) => !stacked.has(pin.id));
  });
  readonly addPosition = computed(() => this.findAddPosition());
  readonly colorVariants: BoardColorVariant[] = ['accent', 'sage', 'clay', 'ink', 'amber'];
  readonly stickerMotifs: StickerMotif[] = [
    'circle',
    'triangle',
    'moon',
    'blob',
    'star',
    'wave',
    'arrow',
    'leaf',
    'cloud',
    'drop',
    'compass',
    'suitcase',
    'camera',
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly cardElements = viewChildren<ElementRef<HTMLElement>>('clipCard');
  private readonly drag = signal<DragState | null>(null);
  private readonly labelPointer = signal<LabelPointerState | null>(null);
  private readonly stickerPointer = signal<StickerPointerState | null>(null);
  private readonly settledGrids = signal<Record<string, UpdateGridBlockRequest>>({});
  private readonly measuredHeights = new Map<string, number>();
  private resizeObserver?: ResizeObserver;
  private suppressedOpenPinId: string | null = null;
  private rejectedTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => this.observeCardHeights(this.cardElements()));
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      if (this.rejectedTimer) clearTimeout(this.rejectedTimer);
    });
  }

  cardLeft(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.leftPx;
    return (this.settledGrids()[pin.id]?.x ?? pin.grid.x) * CLIP_SIZE_PX;
  }

  cardTop(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.topPx;
    return (this.settledGrids()[pin.id]?.y ?? pin.grid.y) * CLIP_SIZE_PX;
  }

  cardHeight(pin: Pin): number {
    const active = this.drag();
    const heightClips =
      active?.pinId === pin.id
        ? active.origin.heightClips
        : (this.settledGrids()[pin.id]?.heightClips ?? pin.grid.heightClips);
    return heightClips * CLIP_SIZE_PX;
  }

  cardLayer(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.layer;
    return this.settledGrids()[pin.id]?.layer ?? pin.grid.layer;
  }

  layerDepth(pin: Pin): number {
    return Math.min(10, Math.max(0, this.cardLayer(pin)));
  }

  layerShadowY(pin: Pin): string {
    return `${2 + this.layerDepth(pin) * 0.16}px`;
  }

  layerShadowBlur(pin: Pin): string {
    return `${7 + this.layerDepth(pin) * 0.42}px`;
  }

  isDragging(pinId: string): boolean {
    return this.drag()?.pinId === pinId && this.drag()?.moved === true;
  }

  isInvalidDrag(pinId: string): boolean {
    const active = this.drag();
    return active?.pinId === pinId && active.moved && active.invalid;
  }

  startDrag(event: PointerEvent, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    const layer = this.maxLayer() + 1;
    this.drag.set({
      pointerId: event.pointerId,
      pinId: pin.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: this.toUpdate(pin.grid),
      leftPx: pin.grid.x * CLIP_SIZE_PX,
      topPx: pin.grid.y * CLIP_SIZE_PX,
      layer,
      moved: false,
      invalid: false,
      stackTarget: null,
    });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  moveDrag(event: PointerEvent): void {
    const active = this.drag();
    if (!active || active.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - active.startClientX;
    const deltaY = event.clientY - active.startClientY;
    const moved = active.moved || Math.hypot(deltaX, deltaY) >= 4;
    if (!moved) return;
    event.preventDefault();
    const next = {
      ...active,
      leftPx: active.origin.x * CLIP_SIZE_PX + deltaX,
      topPx: active.origin.y * CLIP_SIZE_PX + deltaY,
      moved,
    };
    next.stackTarget = this.findStackTarget(active.pinId, this.snapCandidate(next));
    next.invalid = !next.stackTarget && !this.dropAllowed(active.pinId, this.snapCandidate(next));
    this.drag.set(next);
  }

  endDrag(event: PointerEvent): void {
    const active = this.drag();
    if (!active || active.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (!active.moved) {
      this.drag.set(null);
      return;
    }

    event.preventDefault();
    this.suppressedOpenPinId = active.pinId;
    setTimeout(() => (this.suppressedOpenPinId = null));
    const candidate = this.snapCandidate(active);
    if (active.stackTarget) {
      this.onStackDrop.emit({
        pinId: active.pinId,
        targetId: active.stackTarget.id,
        targetType: active.stackTarget.type,
      });
      this.drag.set(null);
      return;
    }
    const accepted = this.dropAllowed(active.pinId, candidate);
    const grid = accepted ? candidate : { ...active.origin, layer: active.layer };

    if (!accepted) this.showRejectedDrop(active.pinId);
    this.setSettledGrid(active.pinId, grid);
    this.onGridChange.emit({ pinId: active.pinId, grid });
    this.drag.set(null);
  }

  cancelDrag(event: PointerEvent): void {
    if (this.drag()?.pointerId === event.pointerId) this.drag.set(null);
  }

  openPin(pinId: string): void {
    if (this.suppressedOpenPinId === pinId) return;
    this.onSelectPin.emit(pinId);
  }

  toggleZoneTool(): void {
    this.activeTool.update((tool) => (tool === 'zone' ? null : 'zone'));
  }

  startBoardPointer(event: PointerEvent): void {
    if (!this.canEdit() || this.activeTool() !== 'zone' || event.target !== event.currentTarget)
      return;
    const board = event.currentTarget as HTMLElement;
    const rect = board.getBoundingClientRect();
    const x = this.clamp(
      Math.floor((event.clientX - rect.left) / CLIP_SIZE_PX),
      0,
      BOARD_WIDTH_CLIPS - 2,
    );
    const y = this.clamp(
      Math.floor((event.clientY - rect.top) / CLIP_SIZE_PX),
      0,
      BOARD_HEIGHT_CLIPS - 2,
    );
    event.preventDefault();
    board.setPointerCapture?.(event.pointerId);
    this.zonePointer.set({
      pointerId: event.pointerId,
      zoneId: null,
      mode: 'draw',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: x,
      startY: y,
      x,
      y,
      widthClips: 2,
      heightClips: 2,
    });
  }

  startZonePointer(event: PointerEvent, zone: SoftZone, mode: 'move' | 'resize'): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.zonePointer.set({
      pointerId: event.pointerId,
      zoneId: zone.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: zone.x,
      startY: zone.y,
      x: zone.x,
      y: zone.y,
      widthClips: zone.widthClips,
      heightClips: zone.heightClips,
    });
  }

  moveBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.moveConnector(event);
      return;
    }
    const state = this.zonePointer();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = Math.round((event.clientX - state.startClientX) / CLIP_SIZE_PX);
    const deltaY = Math.round((event.clientY - state.startClientY) / CLIP_SIZE_PX);
    if (state.mode === 'draw') {
      const currentX = this.clamp(state.startX + deltaX, 0, BOARD_WIDTH_CLIPS - 1);
      const currentY = this.clamp(state.startY + deltaY, 0, BOARD_HEIGHT_CLIPS - 1);
      const x = Math.min(state.startX, currentX);
      const y = Math.min(state.startY, currentY);
      this.zonePointer.set({
        ...state,
        x,
        y,
        widthClips: Math.max(
          2,
          Math.min(BOARD_WIDTH_CLIPS - x, Math.abs(currentX - state.startX) + 1),
        ),
        heightClips: Math.max(
          2,
          Math.min(BOARD_HEIGHT_CLIPS - y, Math.abs(currentY - state.startY) + 1),
        ),
      });
      return;
    }
    if (state.mode === 'move') {
      this.zonePointer.set({
        ...state,
        x: this.clamp(state.startX + deltaX, 0, BOARD_WIDTH_CLIPS - state.widthClips),
        y: this.clamp(state.startY + deltaY, 0, BOARD_HEIGHT_CLIPS - state.heightClips),
      });
      return;
    }
    this.zonePointer.set({
      ...state,
      widthClips: this.clamp(state.widthClips + deltaX, 2, BOARD_WIDTH_CLIPS - state.x),
      heightClips: this.clamp(state.heightClips + deltaY, 2, BOARD_HEIGHT_CLIPS - state.y),
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
  }

  endBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.endConnector(event);
      return;
    }
    const state = this.zonePointer();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    const geometry = {
      x: state.x,
      y: state.y,
      widthClips: state.widthClips,
      heightClips: state.heightClips,
    };
    if (state.mode === 'draw') {
      this.onCreateZone.emit({
        ...geometry,
        colorVariant: this.selectedColor(),
        label: this.newZoneLabel().trim() || null,
      });
      this.activeTool.set(null);
    } else if (state.zoneId) {
      this.onUpdateZone.emit({ id: state.zoneId, update: geometry });
    }
    this.zonePointer.set(null);
  }

  cancelBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.cancelConnector(event);
      return;
    }
    if (this.zonePointer()?.pointerId === event.pointerId) this.zonePointer.set(null);
  }

  zoneX(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.x : zone.x;
  }

  zoneY(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.y : zone.y;
  }

  zoneWidth(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.widthClips : zone.widthClips;
  }

  zoneHeight(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.heightClips : zone.heightClips;
  }

  addFloatingLabel(): void {
    const text = this.newLabelText().trim();
    if (!text) return;
    const index = this.elements().labels.length;
    this.onCreateLabel.emit({
      x: 2 + (index % 8) * 7,
      y: 2 + Math.floor(index / 8) * 4,
      widthClips: 6,
      text,
      layer: this.maxLayer() + 1,
    });
    this.newLabelText.set('');
  }

  startLabelPointer(event: PointerEvent, label: FloatingLabel): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.labelPointer.set({
      pointerId: event.pointerId,
      labelId: label.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: label.x,
      originY: label.y,
      x: label.x,
      y: label.y,
    });
  }

  moveLabelPointer(event: PointerEvent): void {
    const state = this.labelPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    const label = this.elements().labels.find((item) => item.id === state.labelId);
    if (!label) return;
    event.preventDefault();
    this.labelPointer.set({
      ...state,
      x: this.clamp(
        state.originX + Math.round((event.clientX - state.startClientX) / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - label.widthClips,
      ),
      y: this.clamp(
        state.originY + Math.round((event.clientY - state.startClientY) / CLIP_SIZE_PX),
        0,
        BOARD_HEIGHT_CLIPS - 2,
      ),
    });
  }

  endLabelPointer(event: PointerEvent): void {
    const state = this.labelPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.onUpdateLabel.emit({
      id: state.labelId,
      update: { x: state.x, y: state.y, layer: this.maxLayer() + 1 },
    });
    this.labelPointer.set(null);
  }

  cancelLabelPointer(event: PointerEvent): void {
    if (this.labelPointer()?.pointerId === event.pointerId) this.labelPointer.set(null);
  }

  labelValue(label: FloatingLabel): Pick<FloatingLabel, 'x' | 'y'> {
    const state = this.labelPointer();
    return state?.labelId === label.id ? state : label;
  }

  addSticker(motif: StickerMotif, x?: number, y?: number): void {
    const index = this.elements().stickers.length;
    this.onCreateSticker.emit({
      motif,
      colorVariant: this.selectedColor(),
      x: x ?? 36 + (index % 9) * 70,
      y: y ?? 36 + Math.floor(index / 9) * 70,
      widthClips: 4,
      heightClips: 4,
      rotation: ((index * 7) % 21) - 10,
      layer: this.maxLayer() + 1,
    });
  }

  startPaletteStickerDrag(event: DragEvent, motif: StickerMotif): void {
    event.dataTransfer?.setData('application/x-stoasis-sticker', motif);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }

  dropPaletteSticker(event: DragEvent): void {
    const motif = event.dataTransfer?.getData('application/x-stoasis-sticker') as StickerMotif;
    if (!this.stickerMotifs.includes(motif)) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.addSticker(
      motif,
      this.clamp(
        event.clientX - rect.left - CLIP_SIZE_PX * 2,
        0,
        this.boardWidthPx - CLIP_SIZE_PX * 4,
      ),
      this.clamp(
        event.clientY - rect.top - CLIP_SIZE_PX * 2,
        0,
        this.boardHeightPx - CLIP_SIZE_PX * 4,
      ),
    );
  }

  stickerGlyph(motif: StickerMotif): string {
    const glyphs: Record<StickerMotif, string> = {
      circle: '●',
      triangle: '▲',
      moon: '◒',
      blob: '⬮',
      star: '✦',
      wave: '≈',
      arrow: '↗',
      leaf: '⌁',
      cloud: '☁',
      drop: '◆',
      compass: '⌾',
      suitcase: '▣',
      camera: '▢',
    };
    return glyphs[motif];
  }

  startStickerPointer(
    event: PointerEvent,
    sticker: StickerElement,
    mode: StickerPointerState['mode'],
  ): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture?.(event.pointerId);
    const stickerElement = target.closest<HTMLElement>('.board-sticker') ?? target;
    const rect = stickerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    this.selectedStickerId.set(sticker.id);
    this.stickerPointer.set({
      pointerId: event.pointerId,
      stickerId: sticker.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: sticker,
      current: sticker,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
    });
  }

  moveStickerPointer(event: PointerEvent): void {
    const state = this.stickerPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - state.startClientX;
    const deltaY = event.clientY - state.startClientY;
    let current = state.current;
    if (state.mode === 'move') {
      current = {
        ...state.origin,
        x: this.clamp(
          state.origin.x + deltaX,
          0,
          this.boardWidthPx - state.origin.widthClips * CLIP_SIZE_PX,
        ),
        y: this.clamp(
          state.origin.y + deltaY,
          0,
          this.boardHeightPx - state.origin.heightClips * CLIP_SIZE_PX,
        ),
      };
    } else if (state.mode === 'resize') {
      current = {
        ...state.origin,
        widthClips: this.clamp(state.origin.widthClips + deltaX / CLIP_SIZE_PX, 2, 8),
        heightClips: this.clamp(state.origin.heightClips + deltaY / CLIP_SIZE_PX, 2, 8),
      };
    } else {
      const angle = Math.atan2(event.clientY - state.centerY, event.clientX - state.centerX);
      current = {
        ...state.origin,
        rotation: this.clamp(
          state.origin.rotation + ((angle - state.startAngle) * 180) / Math.PI,
          -15,
          15,
        ),
      };
    }
    this.stickerPointer.set({ ...state, current });
  }

  endStickerPointer(event: PointerEvent): void {
    const state = this.stickerPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    const { x, y, widthClips, heightClips, rotation } = state.current;
    this.onUpdateSticker.emit({
      id: state.stickerId,
      update: { x, y, widthClips, heightClips, rotation, layer: this.maxLayer() + 1 },
    });
    this.stickerPointer.set(null);
  }

  cancelStickerPointer(event: PointerEvent): void {
    if (this.stickerPointer()?.pointerId === event.pointerId) this.stickerPointer.set(null);
  }

  stickerValue(sticker: StickerElement): StickerElement {
    const state = this.stickerPointer();
    return state?.stickerId === sticker.id ? state.current : sticker;
  }

  setStickerLayer(sticker: StickerElement, direction: 'back' | 'front'): void {
    this.onUpdateSticker.emit({
      id: sticker.id,
      update: { layer: direction === 'back' ? 0 : this.maxLayer() + 1 },
    });
  }

  startConnector(event: PointerEvent, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget as HTMLElement;
    const card = handle.closest<HTMLElement>('.clip-card');
    const board = handle.closest<HTMLElement>('.clip-board');
    if (!card || !board) return;
    const cardRect = card.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const startX = cardRect.right - boardRect.left;
    const startY = cardRect.top + cardRect.height / 2 - boardRect.top;
    handle.setPointerCapture?.(event.pointerId);
    this.connectorDraft.set({
      pointerId: event.pointerId,
      sourcePinId: pin.id,
      startX,
      startY,
      endX: startX,
      endY: startY,
      boardLeft: boardRect.left,
      boardTop: boardRect.top,
    });
  }

  moveConnector(event: PointerEvent): void {
    const draft = this.connectorDraft();
    if (!draft || draft.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    this.connectorDraft.set({
      ...draft,
      endX: event.clientX - draft.boardLeft,
      endY: event.clientY - draft.boardTop,
    });
  }

  endConnector(event: PointerEvent): void {
    const draft = this.connectorDraft();
    if (!draft || draft.pointerId !== event.pointerId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-pin-id]');
    const targetPinId = target?.dataset['pinId'];
    if (targetPinId && targetPinId !== draft.sourcePinId) {
      this.onCreateConnector.emit({
        sourcePinId: draft.sourcePinId,
        targetPinId,
        color: this.selectedColor(),
      });
    }
    const currentTarget = event.currentTarget as HTMLElement;
    if (currentTarget.hasPointerCapture?.(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId);
    }
    this.connectorDraft.set(null);
  }

  cancelConnector(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) this.connectorDraft.set(null);
  }

  connectorPath(connector: ConnectorThread): string {
    const source = this.pinAnchor(connector.sourcePinId);
    const target = this.pinAnchor(connector.targetPinId);
    return this.curvePath(source.x, source.y, target.x, target.y);
  }

  draftConnectorPath(draft: ConnectorDraft): string {
    return this.curvePath(draft.startX, draft.startY, draft.endX, draft.endY);
  }

  pinById(pinId: string): Pin | null {
    return this.pins().find((pin) => pin.id === pinId) ?? null;
  }

  topPin(stack: StackBlock): Pin | null {
    return this.pinById(stack.children.at(-1) ?? '');
  }

  isStackTarget(type: StackTarget['type'], id: string): boolean {
    const target = this.drag()?.stackTarget;
    return target?.type === type && target.id === id;
  }

  startStackPointer(event: PointerEvent, stack: StackBlock): void {
    if (!this.canEdit() || event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.stackDrag.set({
      pointerId: event.pointerId,
      stackId: stack.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: stack.x,
      originY: stack.y,
      leftPx: stack.x * CLIP_SIZE_PX,
      topPx: stack.y * CLIP_SIZE_PX,
      layer: this.maxLayer() + 1,
      moved: false,
      invalid: false,
    });
  }

  moveStackPointer(event: PointerEvent): void {
    const state = this.stackDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - state.startClientX;
    const deltaY = event.clientY - state.startClientY;
    const moved = state.moved || Math.hypot(deltaX, deltaY) >= 4;
    if (!moved) return;
    event.preventDefault();
    const next = {
      ...state,
      leftPx: state.originX * CLIP_SIZE_PX + deltaX,
      topPx: state.originY * CLIP_SIZE_PX + deltaY,
      moved,
      invalid: false,
    };
    const stack = this.elements().stacks.find((item) => item.id === state.stackId);
    if (stack) next.invalid = !this.stackDropAllowed(stack, this.snapStack(next, stack));
    this.stackDrag.set(next);
  }

  endStackPointer(event: PointerEvent, stack: StackBlock): void {
    const state = this.stackDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (state.moved) {
      const snapped = this.snapStack(state, stack);
      if (this.stackDropAllowed(stack, snapped)) {
        this.onStackChange.emit({ id: stack.id, update: { ...snapped, layer: state.layer } });
      } else {
        this.showRejectedDrop(stack.id);
      }
    }
    this.stackDrag.set(null);
  }

  cancelStackPointer(event: PointerEvent): void {
    if (this.stackDrag()?.pointerId === event.pointerId) this.stackDrag.set(null);
  }

  stackLeft(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.leftPx : stack.x * CLIP_SIZE_PX;
  }

  stackTop(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.topPx : stack.y * CLIP_SIZE_PX;
  }

  stackLayer(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.layer : stack.layer;
  }

  startStackChildPointer(event: PointerEvent, stack: StackBlock, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.stackChildDrag.set({
      pointerId: event.pointerId,
      stackId: stack.id,
      pinId: pin.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      moved: false,
    });
  }

  moveStackChildPointer(event: PointerEvent): void {
    const state = this.stackChildDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const deltaX = event.clientX - state.startClientX;
    const deltaY = event.clientY - state.startClientY;
    this.stackChildDrag.set({
      ...state,
      deltaX,
      deltaY,
      moved: state.moved || Math.hypot(deltaX, deltaY) >= 6,
    });
  }

  endStackChildPointer(event: PointerEvent, stack: StackBlock, pin: Pin): void {
    const state = this.stackChildDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (state.moved) {
      this.suppressedOpenPinId = pin.id;
      setTimeout(() => (this.suppressedOpenPinId = null));
      this.onReleaseStackChild.emit({
        stackId: stack.id,
        pinId: pin.id,
        x: this.clamp(
          stack.x + Math.round(state.deltaX / CLIP_SIZE_PX),
          0,
          BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
        ),
        y: this.clamp(
          stack.y + Math.round(state.deltaY / CLIP_SIZE_PX),
          0,
          BOARD_HEIGHT_CLIPS - pin.grid.heightClips,
        ),
        layer: this.maxLayer() + 1,
      });
    }
    this.stackChildDrag.set(null);
  }

  cancelStackChildPointer(event: PointerEvent): void {
    if (this.stackChildDrag()?.pointerId === event.pointerId) this.stackChildDrag.set(null);
  }

  stackChildTransform(stack: StackBlock, pinId: string, index: number): string {
    const state = this.stackChildDrag();
    const fanX = index * 34;
    const fanY = (index % 2) * 22;
    const rotation = index % 2 === 0 ? -1.2 : 1.2;
    if (state?.stackId === stack.id && state.pinId === pinId) {
      return `translate(${fanX + state.deltaX}px, ${fanY + state.deltaY}px) rotate(${rotation}deg)`;
    }
    return `translate(${fanX}px, ${fanY}px) rotate(${rotation}deg)`;
  }

  private findStackTarget(pinId: string, grid: UpdateGridBlockRequest): StackTarget | null {
    const candidate: GridRect = {
      x: grid.x,
      y: grid.y,
      width: CARD_WIDTH_CLIPS,
      height: grid.heightClips,
    };
    const targets: Array<{ target: StackTarget; ratio: number }> = [];
    for (const pin of this.visiblePins()) {
      if (pin.id === pinId) continue;
      const overlap = intersectionArea(candidate, {
        x: pin.grid.x,
        y: pin.grid.y,
        width: CARD_WIDTH_CLIPS,
        height: pin.grid.heightClips,
      });
      targets.push({
        target: { id: pin.id, type: 'pin' },
        ratio:
          overlap /
          Math.min(CARD_WIDTH_CLIPS * grid.heightClips, CARD_WIDTH_CLIPS * pin.grid.heightClips),
      });
    }
    for (const stack of this.elements().stacks) {
      const overlap = intersectionArea(candidate, {
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      });
      targets.push({
        target: { id: stack.id, type: 'stack' },
        ratio:
          overlap /
          Math.min(CARD_WIDTH_CLIPS * grid.heightClips, CARD_WIDTH_CLIPS * stack.heightClips),
      });
    }
    return (
      targets.sort((a, b) => b.ratio - a.ratio).find((item) => item.ratio >= 0.72)?.target ?? null
    );
  }

  private snapStack(state: StackDragState, stack: StackBlock): { x: number; y: number } {
    return {
      x: this.clamp(
        Math.round(state.leftPx / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
      ),
      y: this.clamp(
        Math.round(state.topPx / CLIP_SIZE_PX),
        0,
        BOARD_HEIGHT_CLIPS - stack.heightClips,
      ),
    };
  }

  private stackDropAllowed(stack: StackBlock, position: { x: number; y: number }): boolean {
    const candidate = {
      x: position.x,
      y: position.y,
      width: CARD_WIDTH_CLIPS,
      height: stack.heightClips,
    };
    const pinsAllowed = this.visiblePins().every((pin) =>
      overlapAllowed(candidate, {
        x: pin.grid.x,
        y: pin.grid.y,
        width: CARD_WIDTH_CLIPS,
        height: pin.grid.heightClips,
      }),
    );
    const stacksAllowed = this.elements()
      .stacks.filter((item) => item.id !== stack.id)
      .every((item) =>
        overlapAllowed(candidate, {
          x: item.x,
          y: item.y,
          width: CARD_WIDTH_CLIPS,
          height: item.heightClips,
        }),
      );
    return pinsAllowed && stacksAllowed;
  }

  private pinAnchor(pinId: string): { x: number; y: number } {
    const stack = this.elements().stacks.find((item) => item.children.includes(pinId));
    if (stack) {
      const activeStack = this.stackDrag();
      const left = activeStack?.stackId === stack.id ? activeStack.leftPx : stack.x * CLIP_SIZE_PX;
      const top = activeStack?.stackId === stack.id ? activeStack.topPx : stack.y * CLIP_SIZE_PX;
      return {
        x: left + (CARD_WIDTH_CLIPS * CLIP_SIZE_PX) / 2,
        y: top + (stack.heightClips * CLIP_SIZE_PX) / 2,
      };
    }
    const pin = this.pinById(pinId);
    const activePin = this.drag();
    if (pin && activePin?.pinId === pinId) {
      return {
        x: activePin.leftPx + (CARD_WIDTH_CLIPS * CLIP_SIZE_PX) / 2,
        y: activePin.topPx + (activePin.origin.heightClips * CLIP_SIZE_PX) / 2,
      };
    }
    return pin
      ? {
          x: (pin.grid.x + CARD_WIDTH_CLIPS / 2) * CLIP_SIZE_PX,
          y: (pin.grid.y + pin.grid.heightClips / 2) * CLIP_SIZE_PX,
        }
      : { x: 0, y: 0 };
  }

  private curvePath(x1: number, y1: number, x2: number, y2: number): string {
    const bend = Math.max(42, Math.min(150, Math.abs(x2 - x1) * 0.42));
    const direction = x2 >= x1 ? 1 : -1;
    return `M ${x1} ${y1} C ${x1 + bend * direction} ${y1}, ${x2 - bend * direction} ${y2}, ${x2} ${y2}`;
  }

  private maxLayer(): number {
    return Math.max(
      0,
      ...this.pins().map((pin) => pin.grid.layer),
      ...this.elements().stacks.map((stack) => stack.layer),
      ...this.elements().labels.map((label) => label.layer),
      ...this.elements().stickers.map((sticker) => sticker.layer),
    );
  }

  private snapCandidate(active: DragState): UpdateGridBlockRequest {
    const heightClips = active.origin.heightClips;
    return {
      x: this.clamp(
        Math.round(active.leftPx / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
      ),
      y: this.clamp(Math.round(active.topPx / CLIP_SIZE_PX), 0, BOARD_HEIGHT_CLIPS - heightClips),
      heightClips,
      layer: active.layer,
    };
  }

  private dropAllowed(pinId: string, grid: UpdateGridBlockRequest): boolean {
    const candidate: GridRect = {
      x: grid.x,
      y: grid.y,
      width: CARD_WIDTH_CLIPS,
      height: grid.heightClips,
    };
    const pinsAllowed = this.visiblePins()
      .filter((pin) => pin.id !== pinId)
      .every((pin) =>
        overlapAllowed(candidate, {
          x: pin.grid.x,
          y: pin.grid.y,
          width: CARD_WIDTH_CLIPS,
          height: pin.grid.heightClips,
        }),
      );
    const stacksAllowed = this.elements().stacks.every((stack) =>
      overlapAllowed(candidate, {
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      }),
    );
    return pinsAllowed && stacksAllowed;
  }

  private findAddPosition(): { x: number; y: number } {
    const height = 12;
    const occupied = this.visiblePins().map((pin) => ({
      x: pin.grid.x,
      y: pin.grid.y,
      width: CARD_WIDTH_CLIPS,
      height: pin.grid.heightClips,
    }));
    occupied.push(
      ...this.elements().stacks.map((stack) => ({
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      })),
    );
    for (let y = 0; y <= BOARD_HEIGHT_CLIPS - height; y += 2) {
      for (let x = 0; x <= BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS; x += CARD_WIDTH_CLIPS + 2) {
        const candidate = { x, y, width: CARD_WIDTH_CLIPS, height };
        if (occupied.every((rect) => intersectionArea(candidate, rect) === 0)) return { x, y };
      }
    }
    return { x: 0, y: BOARD_HEIGHT_CLIPS - height };
  }

  private observeCardHeights(elements: readonly ElementRef<HTMLElement>[]): void {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const wrapper = (entry.target as HTMLElement).closest<HTMLElement>('.clip-card');
        const pinId = wrapper?.dataset['pinId'];
        if (!pinId) continue;
        const heightClips = Math.max(
          1,
          Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height) / CLIP_SIZE_PX,
        );
        this.reportMeasuredHeight(pinId, Math.ceil(heightClips));
      }
    });
    for (const element of elements) {
      const card = element.nativeElement.querySelector<HTMLElement>('.pin-card');
      if (card) this.resizeObserver.observe(card);
    }
  }

  private reportMeasuredHeight(pinId: string, heightClips: number): void {
    if (!this.canEdit() || this.measuredHeights.get(pinId) === heightClips) return;
    this.measuredHeights.set(pinId, heightClips);
    const pin = this.pins().find((item) => item.id === pinId);
    if (!pin || pin.grid.heightClips === heightClips) return;
    const grid: UpdateGridBlockRequest = {
      x: pin.grid.x,
      y: this.clamp(pin.grid.y, 0, BOARD_HEIGHT_CLIPS - heightClips),
      heightClips,
      layer: pin.grid.layer,
    };
    if (this.dropAllowed(pinId, grid)) this.onGridChange.emit({ pinId, grid });
  }

  private setSettledGrid(pinId: string, grid: UpdateGridBlockRequest): void {
    this.settledGrids.update((items) => ({ ...items, [pinId]: grid }));
    setTimeout(
      () =>
        this.settledGrids.update((items) => {
          const next = { ...items };
          delete next[pinId];
          return next;
        }),
      450,
    );
  }

  private showRejectedDrop(pinId: string): void {
    if (this.rejectedTimer) clearTimeout(this.rejectedTimer);
    this.rejectedPinId.set(pinId);
    this.rejectedTimer = setTimeout(() => this.rejectedPinId.set(null), 520);
  }

  private toUpdate(grid: GridBlock): UpdateGridBlockRequest {
    return { x: grid.x, y: grid.y, heightClips: grid.heightClips, layer: grid.layer };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}

@Component({
  selector: 'ui-add-pin-dialog',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-backdrop" (click)="onCancel.emit()">
        <section
          class="dialog-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pin-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <div>
              <p class="eyebrow">{{ 'pin.new' | translate }}</p>
              <h1 id="add-pin-title">{{ 'pin.addTitle' | translate }}</h1>
            </div>
            <button
              type="button"
              class="close-button"
              [attr.aria-label]="'common.close' | translate"
              (click)="onCancel.emit()"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          @if (error()) {
            <p class="dialog-error" role="alert">{{ error() | translate }}</p>
          }
          <div class="pin-type-picker">
            @for (type of typeOptions; track type.value) {
              @if (allowedTypes().includes(type.value)) {
                <button
                  type="button"
                  [class.active]="selectedType() === type.value"
                  (click)="onTypeSelect.emit(type.value)"
                >
                  <span><ui-app-icon [name]="type.icon" /></span
                  ><strong>{{ type.labelKey | translate }}</strong>
                </button>
              }
            }
          </div>
          @switch (selectedType()) {
            @case ('link') {
              <label class="dialog-field"
                ><span>{{ 'pin.address' | translate }}</span
                ><input
                  type="url"
                  placeholder="https://…"
                  [ngModel]="draft().url"
                  (ngModelChange)="onDraftChange.emit({ url: $event })"
                  (blur)="onUrlChange.emit(draft().url)"
              /></label>
              @if (isParsing()) {
                <p class="helper">{{ 'pin.loadingPreview' | translate }}</p>
              }
              @if (preview(); as link) {
                <div class="link-preview">
                  @if (link.imageUrl) {
                    <img
                      [src]="link.imageUrl"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                    />
                  } @else {
                    <ui-app-icon name="link" />
                  }
                  <div>
                    <strong>{{ link.title }}</strong
                    ><small>{{ link.siteName || link.url }}</small>
                  </div>
                </div>
              }
            }
            @case ('note') {
              <label class="dialog-field"
                ><span>{{ 'pin.note' | translate }}</span
                ><textarea
                  rows="7"
                  [placeholder]="'pin.notePlaceholder' | translate"
                  [ngModel]="draft().content"
                  (ngModelChange)="onDraftChange.emit({ content: $event })"
                ></textarea>
              </label>
              <div class="color-picker" [attr.aria-label]="'pin.noteColor' | translate">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    [class]="color"
                    [class.active]="draft().color === color"
                    (click)="onDraftChange.emit({ color })"
                    [attr.aria-label]="
                      'pin.colorLabel' | translate: { color: 'pin.colors.' + color | translate }
                    "
                  ></button>
                }
              </div>
            }
            @case ('photo') {
              <label class="file-drop"
                ><input type="file" accept="image/*" (change)="selectFile($event)" />
                <span><ui-app-icon name="upload" /></span
                ><strong>{{ 'pin.choosePhoto' | translate }}</strong
                ><small>{{ 'pin.photoFormats' | translate }}</small></label
              >
              @if (isUploading()) {
                <div class="progress"><span [style.width.%]="uploadProgress()"></span></div>
                <p class="helper">
                  {{ 'pin.uploadProgress' | translate: { progress: uploadProgress() } }}
                </p>
              }
              @if (uploadedFileName()) {
                <p class="file-name"><ui-app-icon name="check" /> {{ uploadedFileName() }}</p>
              }
              <label class="dialog-field"
                ><span>{{ 'pin.caption' | translate }}</span
                ><input
                  [ngModel]="draft().caption"
                  (ngModelChange)="onDraftChange.emit({ caption: $event })"
              /></label>
            }
          }
          @if (selectedType()) {
            <label class="dialog-field"
              ><span
                >{{ 'common.tags' | translate }}
                <small>({{ 'pin.separateWithComma' | translate }})</small></span
              ><input
                [placeholder]="'pin.tagsPlaceholder' | translate"
                [ngModel]="draft().tags"
                (ngModelChange)="onDraftChange.emit({ tags: $event })"
            /></label>
          }
          <footer>
            <button type="button" class="button secondary" (click)="onCancel.emit()">
              {{ 'common.cancel' | translate }}</button
            ><button
              type="button"
              class="button primary"
              [disabled]="!canSubmit() || isUploading()"
              (click)="onSubmit.emit()"
            >
              {{ 'pin.add' | translate }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPinDialogComponent {
  readonly isOpen = input(false);
  readonly allowedTypes = input.required<PinType[]>();
  readonly selectedType = input<PinType | null>(null);
  readonly draft = input.required<AddPinDraft>();
  readonly preview = input<LinkPreview | null>(null);
  readonly canSubmit = input(false);
  readonly isUploading = input(false);
  readonly isParsing = input(false);
  readonly uploadProgress = input(0);
  readonly uploadedFileName = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly onTypeSelect = output<PinType>();
  readonly onUrlChange = output<string>();
  readonly onFileSelect = output<File>();
  readonly onDraftChange = output<Partial<AddPinDraft>>();
  readonly onSubmit = output<void>();
  readonly onCancel = output<void>();
  readonly typeOptions: { value: PinType; labelKey: string; icon: AppIconName }[] = [
    { value: 'link', labelKey: 'pin.link', icon: 'link' },
    { value: 'note', labelKey: 'pin.note', icon: 'note' },
    { value: 'photo', labelKey: 'pin.photo', icon: 'image' },
  ];
  readonly colors: NotePinData['color'][] = ['yellow', 'blue', 'green'];
  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.onFileSelect.emit(file);
  }
}

@Component({
  selector: 'ui-pin-detail',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (pin(); as item) {
      <div class="detail-backdrop" (click)="onClose.emit()">
        <aside
          class="detail-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-detail-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <span class="detail-type">{{ 'pin.type.' + item.type | translate }}</span
            ><button
              type="button"
              class="close-button"
              [attr.aria-label]="'common.close' | translate"
              (click)="onClose.emit()"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          <div class="detail-content">
            @if (editMode()) {
              @switch (item.type) {
                @case ('link') {
                  <label class="dialog-field"
                    ><span>{{ 'common.title' | translate }}</span
                    ><input
                      [ngModel]="editValue().title"
                      (ngModelChange)="onDraftChange.emit({ title: $event })"
                  /></label>
                  <label class="dialog-field"
                    ><span>{{ 'common.description' | translate }}</span
                    ><textarea
                      rows="4"
                      [ngModel]="editValue().description"
                      (ngModelChange)="onDraftChange.emit({ description: $event })"
                    ></textarea>
                  </label>
                }
                @case ('note') {
                  <label class="dialog-field"
                    ><span>{{ 'pin.note' | translate }}</span
                    ><textarea
                      rows="10"
                      [ngModel]="editValue().content"
                      (ngModelChange)="onDraftChange.emit({ content: $event })"
                    ></textarea>
                  </label>
                }
                @case ('photo') {
                  <label class="dialog-field"
                    ><span>{{ 'pin.caption' | translate }}</span
                    ><input
                      [ngModel]="editValue().caption"
                      (ngModelChange)="onDraftChange.emit({ caption: $event })"
                  /></label>
                }
              }
              <label class="dialog-field"
                ><span>{{ 'common.tags' | translate }}</span
                ><input
                  [ngModel]="editValue().tags"
                  (ngModelChange)="onDraftChange.emit({ tags: $event })"
              /></label>
              <div class="detail-actions">
                <button type="button" class="button secondary" (click)="onCancelEdit.emit()">
                  {{ 'common.cancel' | translate }}</button
                ><button type="button" class="button primary" (click)="onSave.emit()">
                  {{ 'common.save' | translate }}
                </button>
              </div>
            } @else {
              @switch (item.type) {
                @case ('link') {
                  <p class="eyebrow">{{ item.data.siteName || ('pin.webLink' | translate) }}</p>
                  <h1 id="pin-detail-title">{{ item.data.title }}</h1>
                  <p class="detail-lead">{{ item.data.description }}</p>
                  <a class="visit-link" [href]="item.data.url" target="_blank" rel="noopener"
                    >{{ 'pin.openLink' | translate }} <ui-app-icon name="external"
                  /></a>
                }
                @case ('note') {
                  <p class="eyebrow">{{ 'pin.note' | translate }}</p>
                  <h1 id="pin-detail-title">{{ item.data.content }}</h1>
                }
                @case ('photo') {
                  <div class="detail-photo"><ui-app-icon name="image" /></div>
                  <h1 id="pin-detail-title">
                    {{ item.data.caption || ('pin.photo' | translate) }}
                  </h1>
                }
              }
              @if (item.tags.length) {
                <div class="tag-row">
                  @for (tag of item.tags; track tag) {
                    <span>#{{ tag }}</span>
                  }
                </div>
              }
              <p class="detail-meta">
                {{ 'pin.pinnedBy' | translate: { name: item.createdByName } }} ·
                {{ item.createdAt.slice(0, 10) }}
              </p>
              @if (canEdit()) {
                <div class="detail-actions">
                  <button type="button" class="button danger-ghost" (click)="onDelete.emit()">
                    <ui-app-icon name="trash" /> {{ 'common.delete' | translate }}</button
                  ><button type="button" class="button secondary" (click)="onEdit.emit()">
                    <ui-app-icon name="edit" /> {{ 'common.edit' | translate }}
                  </button>
                </div>
              }
            }

            <section class="comments" aria-labelledby="comments-title">
              <h2 id="comments-title">
                {{ 'pin.comments' | translate }} <span>{{ item.comments.length }}</span>
              </h2>
              @for (comment of item.comments; track comment.at + comment.authorId) {
                <article [class.pending]="comment.pending">
                  <strong>{{ comment.authorName | translate }}</strong>
                  <p>{{ comment.body }}</p>
                  <time>{{ comment.at.slice(0, 10) }}</time>
                </article>
              } @empty {
                <p class="helper">{{ 'pin.noComments' | translate }}</p>
              }
              <div class="comment-form">
                <label class="sr-only" for="new-comment">{{ 'pin.comment' | translate }}</label
                ><textarea
                  id="new-comment"
                  rows="2"
                  [placeholder]="'pin.replyPlaceholder' | translate"
                  [(ngModel)]="commentDraft"
                ></textarea
                ><button type="button" [disabled]="!commentDraft.trim()" (click)="submitComment()">
                  <ui-app-icon name="send" /> {{ 'common.send' | translate }}
                </button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    }
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinDetailComponent {
  readonly pin = input<Pin | null>(null);
  readonly canEdit = input(false);
  readonly editMode = input(false);
  readonly editValue = input.required<PinEditValue>();
  readonly onEdit = output<void>();
  readonly onDraftChange = output<Partial<PinEditValue>>();
  readonly onSave = output<void>();
  readonly onCancelEdit = output<void>();
  readonly onDelete = output<void>();
  readonly onCommentSubmit = output<string>();
  readonly onClose = output<void>();
  commentDraft = '';
  submitComment(): void {
    this.onCommentSubmit.emit(this.commentDraft);
    this.commentDraft = '';
  }
}
