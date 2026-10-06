import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CollectionService } from '../data/application/collection.service';
import { DialogComponent } from '../../../shared/ui/dialog';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'feature-collection-duplicate',
  standalone: true,
  imports: [DialogComponent, TranslatePipe, AppIconComponent],
  template: `
    <button
      type="button"
      class="button secondary"
      data-tour="duplicate"
      [disabled]="collections.isSaving()"
      (click)="open()"
    >
      <ui-app-icon name="copy" /> {{ 'templates.duplicate' | translate }}
    </button>
    <ui-dialog
      [open]="isOpen()"
      title="templates.duplicate"
      [busy]="collections.isSaving()"
      (closed)="isOpen.set(false)"
    >
      <p>{{ 'templates.duplicateHint' | translate }}</p>
      <label
        >{{ 'common.name' | translate
        }}<input
          type="text"
          maxlength="180"
          [value]="copyName()"
          (input)="copyName.set($any($event.target).value)"
      /></label>
      @if (collections.error()) {
        <p role="alert">{{ collections.error()! | translate }}</p>
      }
      <footer>
        <button
          type="button"
          class="button secondary"
          [disabled]="collections.isSaving()"
          (click)="isOpen.set(false)"
        >
          {{ 'common.cancel' | translate }}
        </button>
        <button
          type="button"
          class="button primary"
          [disabled]="!copyName().trim() || collections.isSaving()"
          (click)="duplicate()"
        >
          {{ 'templates.createCopy' | translate }}
        </button>
      </footer>
    </ui-dialog>
  `,
  styleUrl: '../../../shared/ui/action-buttons.scss',
  styles: `
    :host {
      display: contents;
    }
    p {
      color: var(--muted);
      line-height: 1.6;
    }
    label {
      display: grid;
      gap: 8px;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 7px;
      background: var(--surface-sunken);
      color: var(--text);
      font: inherit;
    }
    footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      flex-wrap: wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDuplicateHandlerComponent {
  readonly collectionId = input.required<string>();
  readonly name = input.required<string>();
  protected readonly collections = inject(CollectionService);
  private readonly translate = inject(TranslateService);
  readonly copyName = signal('');
  readonly isOpen = signal(false);
  open(): void {
    this.collections.clearError();
    this.copyName.set(this.translate.instant('templates.copyName', { name: this.name() }));
    this.isOpen.set(true);
  }
  duplicate(): void {
    if (this.copyName().trim())
      this.collections.duplicate(this.collectionId(), this.copyName().trim(), () =>
        this.isOpen.set(false),
      );
  }
}
