import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { OnboardingService } from '../application/onboarding.service';
import { Tutorial } from '../models/tutorial';
import { DialogComponent } from './dialog';
import { PopoverComponent } from './popover';

/** Feature-independent tour runner. Skipping, closing and finishing persist the same seen flag. */
@Component({
  selector: 'feature-onboarding',
  standalone: true,
  imports: [DialogComponent, PopoverComponent, TranslatePipe],
  template: `
    <button type="button" class="tutorial-replay" (click)="replay()">
      {{ 'onboarding.show' | translate }}
    </button>
    <ui-dialog
      [open]="isOpen() && index() === -1"
      [title]="tutorial().title"
      [busy]="onboarding.isSaving()"
      (closed)="skip()"
    >
      <p>{{ tutorial().introduction | translate }}</p>
      <div class="tour-actions">
        <button
          type="button"
          class="button secondary"
          [disabled]="onboarding.isSaving()"
          (click)="skip()"
        >
          {{ 'onboarding.skip' | translate }}
        </button>
        <button
          type="button"
          class="button primary"
          [disabled]="onboarding.isSaving()"
          (click)="next()"
        >
          {{ 'onboarding.start' | translate }}
        </button>
      </div>
    </ui-dialog>
    @if (step(); as current) {
      <ui-popover
        [open]="isOpen() && index() >= 0"
        [title]="current.title"
        [text]="current.text"
        [anchor]="anchor()"
        [busy]="onboarding.isSaving()"
        (closed)="skip()"
      >
        <p class="tour-progress" aria-live="polite">
          {{
            'onboarding.progress'
              | translate: { current: index() + 1, total: tutorial().steps.length }
          }}
        </p>
        <div class="tour-actions">
          <button
            type="button"
            class="button secondary"
            [disabled]="onboarding.isSaving()"
            (click)="skip()"
          >
            {{ 'onboarding.skip' | translate }}
          </button>
          <button
            type="button"
            class="button primary"
            [disabled]="onboarding.isSaving()"
            (click)="next()"
          >
            {{
              (index() === tutorial().steps.length - 1 ? 'onboarding.finish' : 'onboarding.next')
                | translate
            }}
          </button>
        </div>
      </ui-popover>
    }
  `,
  styleUrl: './action-buttons.scss',
  styles: `
    p {
      color: var(--muted);
      line-height: 1.6;
    }
    .tour-actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 12px;
    }
    .tour-progress {
      font-size: 0.8rem;
    }
    .tutorial-replay {
      border: 0;
      background: transparent;
      color: var(--muted);
      padding: 12px;
      cursor: pointer;
      font: inherit;
      font-size: 0.8rem;
      min-height: 40px;
    }
    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  readonly tutorial = input.required<Tutorial>();
  readonly available = input(true);
  protected readonly onboarding = inject(OnboardingService);
  private readonly document = inject(DOCUMENT);
  readonly index = signal(-1);
  private readonly dismissed = signal(false);
  private readonly manual = signal(false);
  readonly isOpen = computed(
    () =>
      this.available() &&
      !this.dismissed() &&
      (this.manual() || (this.onboarding.ready() && !this.onboarding.hasSeen(this.tutorial().key))),
  );
  readonly step = computed(() => this.tutorial().steps[this.index()] ?? null);
  readonly anchor = computed(() =>
    this.step() ? this.document.querySelector<HTMLElement>(this.step()!.anchor) : null,
  );

  replay(): void {
    this.index.set(-1);
    this.dismissed.set(false);
    this.manual.set(true);
  }
  skip(): void {
    this.onboarding.acknowledge(this.tutorial().key, 'skipped', () => this.dismissed.set(true));
  }
  next(): void {
    if (this.index() < this.tutorial().steps.length - 1) this.index.update((index) => index + 1);
    else
      this.onboarding.acknowledge(this.tutorial().key, 'completed', () => this.dismissed.set(true));
  }
}
