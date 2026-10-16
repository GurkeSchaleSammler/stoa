import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { ConnectorThread } from '../data/models/connector-thread';
import { BoardExperienceStore } from '../data/application/board-experience.store';
import { BoardNetworkViewComponent } from '../ui/board-network-view';
import { BoardTimelineViewComponent } from '../ui/board-timeline-view';
import { BoardPresentationsComponent } from '../ui/board-presentations';
import { DateDraft, PathDraft } from '../data/models/board-experience';

@Component({
  selector: 'feature-board-experience-handler',
  standalone: true,
  imports: [
    TranslatePipe,
    BoardNetworkViewComponent,
    BoardTimelineViewComponent,
    BoardPresentationsComponent,
  ],
  providers: [BoardExperienceStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (viewMode() === 'network' || viewMode() === 'timeline' || viewMode() === 'presentation') {
      @if (store.error(); as error) {
        <p role="alert">
          {{ error | translate }}
          <button type="button" [disabled]="store.saving()" (click)="store.load(collectionId())">
            {{ 'board.experience.retry' | translate }}
          </button>
        </p>
      }
      @if (store.loading()) {
        <p role="status">{{ 'board.loading' | translate }}</p>
      }
      @if (viewMode() === 'network') {
        <ui-board-network-view
          [pins]="pins()"
          [connectors]="connectors()"
          [canEdit]="canEdit()"
          [labelLimit]="store.value()?.connectorLabelLimit ?? (store.value() ? null : 10)"
          (pinSelected)="pinSelected.emit($event)"
          (connectorUpdated)="connectorUpdated.emit($event)"
          (connectorCreated)="connectorCreated.emit($event)"
          (connectorDeleted)="connectorDeleted.emit($event)"
        />
      }
      @if (store.value(); as value) {
        @if (viewMode() === 'timeline') {
          <ui-board-timeline-view
            [pins]="pins()"
            [dates]="value.dates"
            [canEdit]="canEdit()"
            [saving]="store.saving()"
            (pinSelected)="pinSelected.emit($event)"
            (dateSaved)="saveDate($event)"
          />
        }
        @if (viewMode() === 'presentation') {
          <ui-board-presentations
            [pins]="pins()"
            [paths]="value.paths"
            [limit]="value.presentationPathLimit"
            [canEdit]="canEdit()"
            [saving]="store.saving()"
            (pathSaved)="savePath($event)"
            (pathDeleted)="store.deletePath($event)"
          />
        }
      }
    }
  `,
})
export class BoardExperienceHandlerComponent {
  readonly collectionId = input.required<string>();
  readonly pins = input.required<Pin[]>();
  readonly connectors = input.required<ConnectorThread[]>();
  readonly canEdit = input(false);
  readonly viewMode = input.required<BoardViewMode>();
  readonly pinSelected = output<string>();
  readonly connectorUpdated = output<{ id: string; label: string }>();
  readonly connectorCreated = output<{ sourcePinId: string; targetPinId: string }>();
  readonly connectorDeleted = output<string>();
  readonly store = inject(BoardExperienceStore);
  private readonly timeline = viewChild(BoardTimelineViewComponent);
  private readonly presentations = viewChild(BoardPresentationsComponent);
  constructor() {
    effect(() => {
      const id = this.collectionId();
      untracked(() => {
        if (id) this.store.load(id);
      });
    });
  }
  saveDate(draft: DateDraft) {
    this.store.saveDate(draft, () => this.timeline()?.editing.set(null));
  }
  savePath(draft: PathDraft) {
    this.store.savePath(draft, () => this.presentations()?.draft.set(null));
  }
}
