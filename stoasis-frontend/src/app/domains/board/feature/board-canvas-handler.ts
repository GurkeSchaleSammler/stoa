import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { PinService } from '../data/application/pin.service';
import { BoardViewMode } from '../data/models/board.models';
import { BoardCanvasComponent } from '../ui/board-components';
import { AddPinDialogHandlerComponent } from './add-pin-dialog-handler';
import { PinDetailHandlerComponent } from './pin-detail-handler';

@Component({
  selector: 'feature-board-canvas-handler',
  standalone: true,
  imports: [BoardCanvasComponent, AddPinDialogHandlerComponent, PinDetailHandlerComponent],
  template: `
    <ui-board-canvas
      [pins]="pins.sortedPins()"
      [context]="pins.context()"
      [viewMode]="pins.viewMode()"
      [selectedPinId]="pins.selectedPinId()"
      [canEdit]="pins.canEdit()"
      [isLoading]="pins.isLoading()"
      [error]="pins.error()"
      (onSelectPin)="selectPin($event)"
      (onAddPinClick)="addDialogOpen.set(true)"
      (onViewModeChange)="changeView($event)"
      (onReorder)="pins.reorderPin(collectionId(), $event.pinId, $event.newOrder)"
      (onMembersClick)="openMembers()"
      (onSettingsClick)="openSettings()"
    />
    @if (pins.context(); as context) {
      <feature-add-pin-dialog-handler
        [collectionId]="collectionId()"
        [allowedTypes]="context.allowedTypes"
        [isOpen]="addDialogOpen()"
        (onClose)="addDialogOpen.set(false)"
      />
    }
    @if (pins.selectedPin(); as selected) {
      <feature-pin-detail-handler
        [collectionId]="collectionId()"
        [pin]="selected"
        (onClose)="closePin()"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCanvasHandlerComponent {
  protected readonly pins = inject(PinService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly collectionId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  private readonly selectedPinFromUrl = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('pin')),
      distinctUntilChanged(),
    ),
    { initialValue: this.route.snapshot.queryParamMap.get('pin') },
  );
  readonly addDialogOpen = signal(false);

  constructor() {
    effect(() => {
      const id = this.collectionId();
      untracked(() => {
        this.addDialogOpen.set(false);
        if (id) this.pins.loadPins(id);
      });
    });
    effect(() => {
      const pinId = this.selectedPinFromUrl();
      untracked(() => this.pins.selectPin(pinId));
    });
  }

  selectPin(pinId: string): void {
    this.pins.selectPin(pinId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pin: pinId },
      queryParamsHandling: 'merge',
    });
  }
  closePin(): void {
    this.pins.selectPin(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pin: null },
      queryParamsHandling: 'merge',
    });
  }
  changeView(mode: BoardViewMode): void {
    this.pins.setViewMode(mode);
  }
  openMembers(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'members']);
  }
  openSettings(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'settings']);
  }
}
