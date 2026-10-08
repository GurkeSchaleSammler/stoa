import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionDuplicateHandlerComponent } from '../../collection/public-api';
import { BoardClipboardService } from '../data/application/board-clipboard.service';
import { PinService } from '../data/application/pin.service';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { OnboardingComponent } from '../../../shared/ui/onboarding';
import { Tutorial } from '../../../shared/models/tutorial';
import { BoardContext } from '../data/models/board-context';
import { ViewportService } from '../../../shared/application/viewport.service';

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
        <details
          #reuseMenu
          class="reuse-menu"
          [open]="!compact()"
          (keydown.escape)="closeMenu()"
          (click)="closeAfterAction($event)"
        >
          <summary>
            {{ 'templates.actions' | translate }} <ui-app-icon name="chevron-right" />
          </summary>
          <div class="reuse-actions">
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
                <ui-app-icon name="clipboard" />{{ 'templates.paste' | translate }}
              </button>
              @if (clipboard.copied(); as copied) {
                <span class="copied-label">{{
                  'templates.clipboard' | translate: { name: copied.label }
                }}</span>
              }
            }
          </div>
        </details>
        <feature-onboarding [tutorial]="tutorial" [available]="!pins.selectedPin()" />
      </div>
    }
  `,
  styleUrl: '../../../shared/ui/action-buttons.scss',
  styles: `
    .reuse-bar {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-raised);
    }
    .reuse-menu {
      min-width: 0;
    }
    .reuse-menu summary {
      display: none;
    }
    .reuse-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
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
    @media (max-width: 760px) {
      .reuse-bar {
        padding: 6px 13px;
      }
      .reuse-menu summary {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        padding: 0 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-control);
        color: var(--text);
        font-size: 0.8rem;
        cursor: pointer;
        list-style: none;
      }
      .reuse-menu summary::-webkit-details-marker {
        display: none;
      }
      .reuse-menu[open] summary ui-app-icon {
        transform: rotate(90deg);
      }
      .reuse-actions {
        position: absolute;
        top: calc(100% - 1px);
        left: 13px;
        z-index: 40;
        width: min(340px, calc(100% - 26px));
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-panel);
        background: var(--surface-raised);
        box-shadow: var(--shadow-lg);
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardReuseHandlerComponent {
  readonly context = input.required<BoardContext>();
  protected readonly clipboard = inject(BoardClipboardService);
  protected readonly pins = inject(PinService);
  readonly compact = inject(ViewportService).compact;
  private readonly menu = viewChild<ElementRef<HTMLDetailsElement>>('reuseMenu');

  @HostListener('document:pointerdown', ['$event'])
  closeOutside(event: PointerEvent): void {
    const menu = this.menu()?.nativeElement;
    if (menu && !menu.contains(event.target as Node)) this.closeMenu();
  }

  closeAfterAction(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button, a')) this.closeMenu();
  }

  closeMenu(): void {
    const menu = this.menu()?.nativeElement;
    if (!this.compact() || !menu?.open) return;
    if (menu.contains(document.activeElement)) menu.querySelector('summary')?.focus();
    menu.open = false;
  }
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
