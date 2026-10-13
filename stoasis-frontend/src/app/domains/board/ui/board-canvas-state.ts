import {
  DestroyRef,
  Directive,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { BoardCursorPosition, BoardParticipant } from '../data/models/board-presence';
import { Pin } from '../../../shared/models/pin';
import { PortalPinData } from '../../../shared/models/portal-pin-data';
import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { BoardColorVariant } from '../data/models/board-color-variant';
import { BoardContext } from '../data/models/board-context';
import { BoardElements } from '../data/models/board-elements';
import { boardColorCssValue } from '../data/models/board-color';
import { CARD_WIDTH_CLIPS } from '../data/models/card-width-clips';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { CreateFloatingLabelRequest } from '../data/models/create-floating-label-request';
import { CreateSoftZoneRequest } from '../data/models/create-soft-zone-request';
import { CreateStickerRequest } from '../data/models/create-sticker-request';
import { StackBlock } from '../data/models/stack-block';
import { StickerMotif } from '../data/models/sticker-motif';
import { UpdateGridBlockRequest } from '../data/models/update-grid-block-request';
import { UpdateStickerRequest } from '../data/models/update-sticker-request';
import { BoardTool } from './models/board-tool';
import { ConnectorDraft } from './models/connector-draft';
import { DragState } from './models/drag-state';
import { ImageFullView } from './models/image-full-view';
import { LabelPointerState } from './models/label-pointer-state';
import { PinGridChange } from './models/pin-grid-change';
import { PinResizeState } from './models/pin-resize-state';
import { StackChildDragState } from './models/stack-child-drag-state';
import { StackChildRelease } from './models/stack-child-release';
import { StackDragState } from './models/stack-drag-state';
import { StackDrop } from './models/stack-drop';
import { StickerPointerState } from './models/sticker-pointer-state';
import { ZonePointerState } from './models/zone-pointer-state';

@Directive()
export abstract class BoardCanvasState {
  readonly pins = input.required<Pin[]>();
  readonly participants = input<BoardParticipant[]>([]);
  readonly cursorMoved = output<BoardCursorPosition | null>();
  readonly elements = input.required<BoardElements>();
  readonly context = input<BoardContext | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly selectedPinId = input<string | null>(null);
  readonly canEdit = input(false);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly onSelectPin = output<string>();
  readonly onNavigatePortal = output<PortalPinData>();
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
  readonly onUpdateConnector = output<{ id: string; color: string }>();
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
  readonly onConsoleClick = output<void>();
  readonly onSettingsClick = output<void>();

  readonly clipSizePx = CLIP_SIZE_PX;
  readonly cardWidthPx = CARD_WIDTH_CLIPS * CLIP_SIZE_PX;
  readonly boardWidthPx = BOARD_WIDTH_CLIPS * CLIP_SIZE_PX;
  readonly boardHeightPx = BOARD_HEIGHT_CLIPS * CLIP_SIZE_PX;
  readonly zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2];
  readonly minZoomLevel = this.zoomSteps[0];
  readonly maxZoomLevel = this.zoomSteps[this.zoomSteps.length - 1];
  readonly zoomLevel = signal(1);
  readonly zoomPercent = computed(() => Math.round(this.zoomLevel() * 100));
  readonly scaledBoardWidthPx = computed(() => this.boardWidthPx * this.zoomLevel());
  readonly scaledBoardHeightPx = computed(() => this.boardHeightPx * this.zoomLevel());
  readonly rejectedPinId = signal<string | null>(null);
  readonly paletteOpen = signal(false);
  readonly imageFullView = signal<ImageFullView | null>(null);
  readonly activeTool = signal<BoardTool>(null);
  readonly selectedColor = signal<BoardColorVariant>('sage');
  readonly selectedConnectorId = signal<string | null>(null);
  readonly newZoneLabel = signal('');
  readonly newLabelText = signal('');
  readonly selectedStickerId = signal<string | null>(null);
  readonly zonePointer = signal<ZonePointerState | null>(null);
  readonly stackDrag = signal<StackDragState | null>(null);
  readonly stackChildDrag = signal<StackChildDragState | null>(null);
  readonly connectorDraft = signal<ConnectorDraft | null>(null);
  readonly selectedConnector = computed(
    () => this.elements().connectors.find((item) => item.id === this.selectedConnectorId()) ?? null,
  );
  readonly visiblePins = computed(() => {
    const stacked = new Set(this.elements().stacks.flatMap((stack) => stack.children));
    return this.pins().filter((pin) => !stacked.has(pin.id));
  });
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

  protected readonly destroyRef = inject(DestroyRef);
  protected readonly cardElements = viewChildren<ElementRef<HTMLElement>>('clipCard');
  protected readonly drag = signal<DragState | null>(null);
  protected readonly pinResize = signal<PinResizeState | null>(null);
  protected readonly labelPointer = signal<LabelPointerState | null>(null);
  protected readonly stickerPointer = signal<StickerPointerState | null>(null);
  protected readonly settledGrids = signal<Record<string, UpdateGridBlockRequest>>({});
  protected readonly measuredHeights = new Map<string, number>();
  protected resizeObserver?: ResizeObserver;
  protected suppressedOpenPinId: string | null = null;
  protected rejectedTimer?: ReturnType<typeof setTimeout>;

  openImageFullView(image: ImageFullView): void {
    if (image.src) this.imageFullView.set(image);
  }

  closeImageFullView(): void {
    this.imageFullView.set(null);
  }

  zoomIn(): void {
    this.setZoom(this.zoomSteps.find((step) => step > this.zoomLevel()) ?? this.zoomLevel());
  }

  zoomOut(): void {
    this.setZoom(
      [...this.zoomSteps].reverse().find((step) => step < this.zoomLevel()) ?? this.zoomLevel(),
    );
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  setZoom(level: number): void {
    this.zoomLevel.set(Math.min(this.maxZoomLevel, Math.max(this.minZoomLevel, level)));
  }

  colorCssValue(color: string | null | undefined): string {
    return boardColorCssValue(color);
  }

  colorSoftCssValue(color: string | null | undefined, amount = 13): string {
    return `color-mix(in srgb, ${this.colorCssValue(color)} ${amount}%, transparent)`;
  }

  protected boardDelta(value: number): number {
    return value / this.zoomLevel();
  }
}
