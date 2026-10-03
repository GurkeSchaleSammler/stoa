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
import { BoardCanvasComponent } from '../ui/board-canvas';
import { StackDrop } from '../ui/models/stack-drop';
import { AddPinDialogHandlerComponent } from './add-pin-dialog-handler';
import { PinDetailHandlerComponent } from './pin-detail-handler';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { BoardConsoleHandlerComponent } from './board-console-handler';

@Component({
  selector: 'feature-board-canvas-handler',
  host: { class: 'stoa-board' },
  standalone: true,
  imports: [
    BoardCanvasComponent,
    AddPinDialogHandlerComponent,
    PinDetailHandlerComponent,
    BoardConsoleHandlerComponent,
  ],
  template: `
    <ui-board-canvas
      [pins]="pins.sortedPins()"
      [elements]="pins.elements()"
      [context]="pins.context()"
      [viewMode]="pins.viewMode()"
      [selectedPinId]="pins.selectedPinId()"
      [canEdit]="pins.canEdit()"
      [isLoading]="pins.isLoading()"
      [error]="pins.error() || pins.elementsError()"
      (onSelectPin)="selectPin($event)"
      (onAddPinClick)="addDialogOpen.set(true)"
      (onViewModeChange)="changeView($event)"
      (onGridChange)="pins.updateGrid(collectionId(), $event.pinId, $event.grid)"
      (onStackDrop)="handleStackDrop($event)"
      (onStackChange)="pins.stackActions.update(collectionId(), $event.id, $event.update)"
      (onReleaseStackChild)="
        pins.stackActions.releaseChild(collectionId(), $event.stackId, $event.pinId, $event)
      "
      (onDissolveStack)="pins.stackActions.dissolve(collectionId(), $event)"
      (onCreateConnector)="
        pins.connectorActions.create(
          collectionId(),
          $event.sourcePinId,
          $event.targetPinId,
          $event.color
        )
      "
      (onDeleteConnector)="pins.connectorActions.delete(collectionId(), $event)"
      (onUpdateConnector)="pins.connectorActions.update(collectionId(), $event.id, $event.color)"
      (onCreateZone)="pins.decorationActions.createZone(collectionId(), $event)"
      (onUpdateZone)="pins.decorationActions.updateZone(collectionId(), $event.id, $event.update)"
      (onDeleteZone)="pins.decorationActions.deleteZone(collectionId(), $event)"
      (onCreateLabel)="pins.decorationActions.createLabel(collectionId(), $event)"
      (onUpdateLabel)="pins.decorationActions.updateLabel(collectionId(), $event.id, $event.update)"
      (onDeleteLabel)="pins.decorationActions.deleteLabel(collectionId(), $event)"
      (onCreateSticker)="pins.decorationActions.createSticker(collectionId(), $event)"
      (onUpdateSticker)="
        pins.decorationActions.updateSticker(collectionId(), $event.id, $event.update)
      "
      (onDeleteSticker)="pins.decorationActions.deleteSticker(collectionId(), $event)"
      (onMembersClick)="openMembers()"
      (onConsoleClick)="consoleOpen.set(true)"
      (onSettingsClick)="openSettings()"
    />
    @if (pins.context(); as context) {
      <feature-board-console-handler
        [isOpen]="consoleOpen()"
        [collectionId]="collectionId()"
        [boardName]="context.name"
        (close)="consoleOpen.set(false)"
        (executed)="pins.loadPins(collectionId())"
      />
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
  readonly consoleOpen = signal(false);

  constructor() {
    effect(() => {
      const id = this.collectionId();
      untracked(() => {
        this.addDialogOpen.set(false);
        this.consoleOpen.set(false);
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
      this.pins.stackActions.addChild(this.collectionId(), drop.targetId, drop.pinId);
    } else {
      this.pins.stackActions.create(this.collectionId(), drop.pinId, drop.targetId);
    }
  }
  openMembers(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'members']);
  }
  openSettings(): void {
    void this.router.navigate(['/collections', this.collectionId(), 'settings']);
  }
}
