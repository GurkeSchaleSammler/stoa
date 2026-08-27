import { Directive } from '@angular/core';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { StickerElement } from '../data/models/sticker-element';
import { StickerMotif } from '../data/models/sticker-motif';
import { BoardCanvasZoneInteractions } from './board-canvas-zone-interactions';
import { StickerPointerState } from './models/sticker-pointer-state';

@Directive()
export abstract class BoardCanvasStickerInteractions extends BoardCanvasZoneInteractions {
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
        this.boardDelta(event.clientX - rect.left) - CLIP_SIZE_PX * 2,
        0,
        this.boardWidthPx - CLIP_SIZE_PX * 4,
      ),
      this.clamp(
        this.boardDelta(event.clientY - rect.top) - CLIP_SIZE_PX * 2,
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
    const deltaX = this.boardDelta(event.clientX - state.startClientX);
    const deltaY = this.boardDelta(event.clientY - state.startClientY);
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
}
