import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionDuplicateHandlerComponent } from '../../collection/public-api';
import { BoardClipboardService } from '../data/application/board-clipboard.service';
import { PinService } from '../data/application/pin.service';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { OnboardingComponent } from '../../../shared/ui/onboarding';
import { Tutorial } from '../../../shared/models/tutorial';
import { BoardContext } from '../data/models/board-context';

@Component({
  selector: 'feature-board-reuse-handler',
  standalone: true,
  imports: [
    CollectionDuplicateHandlerComponent,
    TranslatePipe,
    RouterLink,
    AppIconComponent,
    OnboardingComponent,
  ],
  template: `
    @if (!context().isSystem && context().currentUserRole) {
      <div class="reuse-bar">
        <a routerLink="/collections/new" class="button secondary"
          ><ui-app-icon name="grid" />{{ 'templates.newFromTemplate' | translate }}</a
        >
        <feature-collection-duplicate [collectionId]="context().id" [name]="context().name" />
        @if (pins.canEdit()) {
          <button
            type="button"
            class="button secondary"
            data-tour="paste"
            [disabled]="!clipboard.copied() || pins.isMutating()"
            (click)="paste()"
          >
            <ui-app-icon name="copy" />{{ 'templates.paste' | translate }}
          </button>
          @if (clipboard.copied(); as copied) {
            <span class="copied-label">{{
              'templates.clipboard' | translate: { name: copied.label }
            }}</span>
          }
        }
        <feature-onboarding [tutorial]="tutorial" [available]="!pins.selectedPin()" />
      </div>
    }
  `,
  styleUrl: '../../../shared/ui/action-buttons.scss',
  styles: `
    .reuse-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-raised);
    }
    .copied-label {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .button {
      min-height: 40px;
      font-size: 0.8rem;
    }
    feature-onboarding {
      margin-left: auto;
    }
    @media (max-width: 480px) {
      .reuse-bar {
        padding: 12px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardReuseHandlerComponent {
  readonly context = input.required<BoardContext>();
  protected readonly clipboard = inject(BoardClipboardService);
  protected readonly pins = inject(PinService);
  readonly tutorial: Tutorial = {
    key: 'tutorial.board-copy.v1',
    title: 'templates.copyTour.title',
    introduction: 'templates.copyTour.introduction',
    steps: [
      {
        title: 'templates.copyTour.duplicateTitle',
        text: 'templates.copyTour.duplicateText',
        anchor: '[data-tour="duplicate"]',
      },
      {
        title: 'templates.copyTour.pinTitle',
        text: 'templates.copyTour.pinText',
        anchor: '[data-tour="paste"]',
      },
    ],
  };
  paste(): void {
    const copy = this.clipboard.copied();
    if (copy) this.pins.pastePin(this.context().id, copy.sourceCollectionId, copy.pinId);
  }
}
