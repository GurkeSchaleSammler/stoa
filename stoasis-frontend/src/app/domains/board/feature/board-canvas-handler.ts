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
import { BoardCanvasComponent, StackDrop } from '../ui/board-components';
import { AddPinDialogHandlerComponent } from './add-pin-dialog-handler';
import { PinDetailHandlerComponent } from './pin-detail-handler';
import { BoardViewMode } from '../../../shared/models/board-view-mode';

@Component({
  selector: 'feature-board-canvas-handler',
  standalone: true,
  imports: [BoardCanvasComponent, AddPinDialogHandlerComponent, PinDetailHandlerComponent],
  template: `
    <ui-board-canvas
      [pins]="pins.sortedPins()"
      [elements]="pins.elements()"
      [context]="pins.context()"
      [viewMode]="pins.viewMode()"
      [selectedPinId]="pins.selectedPinId()"
      [canEdit]="pins.canEdit()"
      [isLoading]="pins.isLoading()"
      [error]="pins.error()"
      (onSelectPin)="selectPin($event)"
      (onAddPinClick)="addDialogOpen.set(true)"
      (onViewModeChange)="changeView($event)"
      (onGridChange)="pins.updateGrid(collectionId(), $event.pinId, $event.grid)"
      (onStackDrop)="handleStackDrop($event)"
      (onStackChange)="pins.updateStack(collectionId(), $event.id, $event.update)"
      (onReleaseStackChild)="
        pins.releaseStackChild(collectionId(), $event.stackId, $event.pinId, $event)
      "
      (onDissolveStack)="pins.dissolveStack(collectionId(), $event)"
      (onCreateConnector)="
        pins.createConnector(collectionId(), $event.sourcePinId, $event.targetPinId, $event.color)
      "
      (onDeleteConnector)="pins.deleteConnector(collectionId(), $event)"
      (onCreateZone)="pins.createZone(collectionId(), $event)"
      (onUpdateZone)="pins.updateZone(collectionId(), $event.id, $event.update)"
      (onDeleteZone)="pins.deleteZone(collectionId(), $event)"
      (onCreateLabel)="pins.createLabel(collectionId(), $event)"
      (onUpdateLabel)="pins.updateLabel(collectionId(), $event.id, $event.update)"
      (onDeleteLabel)="pins.deleteLabel(collectionId(), $event)"
      (onCreateSticker)="pins.createSticker(collectionId(), $event)"
      (onUpdateSticker)="pins.updateSticker(collectionId(), $event.id, $event.update)"
      (onDeleteSticker)="pins.deleteSticker(collectionId(), $event)"
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
  handleStackDrop(drop: StackDrop): void {
    if (drop.targetType === 'stack') {
      this.pins.addToStack(this.collectionId(), drop.targetId, drop.pinId);
    } else {
      this.pins.createStack(this.collectionId(), drop.pinId, drop.targetId);
    }
  }
  openMembers(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'members']);
  }
  openSettings(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'settings']);
  }
}
