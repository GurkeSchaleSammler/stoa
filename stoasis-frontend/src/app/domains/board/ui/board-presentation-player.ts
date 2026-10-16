import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { PresentationPath, pinTitle } from '../data/models/board-experience';
import { BoardPresentationContentComponent } from './board-presentation-content';

@Component({
  selector: 'ui-board-presentation-player',
  standalone: true,
  imports: [TranslatePipe, BoardPresentationContentComponent],
  template: `
    <dialog
      #dialog
      class="presentation-dialog"
      [attr.aria-label]="path().name"
      (cancel)="$event.preventDefault(); closed.emit()"
      (keydown)="key($event)"
    >
      <header>
        <strong>{{ path().name }}</strong
        ><span aria-live="polite">{{ index() + 1 }} / {{ steps().length }}</span
        ><button type="button" autofocus (click)="closed.emit()">
          {{ 'common.close' | translate }}
        </button>
      </header>
      <div #viewport class="presentation-viewport">
        @if (active(); as current) {
          <div class="presentation-camera" [style.transform]="camera()">
            @for (pin of uniquePins(); track pin.id) {
              <section
                class="presentation-pin"
                [class.current]="pin.id === current.id"
                [attr.aria-hidden]="pin.id !== current.id"
                [attr.inert]="pin.id !== current.id ? '' : null"
                [style.left.px]="pin.grid.x * 32"
                [style.top.px]="pin.grid.y * 32"
              >
                <ui-board-presentation-content [pin]="pin" />
              </section>
            }
          </div>
        } @else {
          <p>{{ 'board.experience.missingPin' | translate }}</p>
        }
      </div>
      <footer>
        <button type="button" [disabled]="index() <= 0" (click)="move(-1)">
          ← {{ 'board.experience.previous' | translate }}
        </button>
        <p>{{ 'board.experience.playerHelp' | translate }}</p>
        <button type="button" [disabled]="index() >= steps().length - 1" (click)="move(1)">
          {{ 'board.experience.next' | translate }} →
        </button>
      </footer>
    </dialog>
  `,
  styleUrl: './board-presentation-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPresentationPlayerComponent implements AfterViewInit, OnDestroy {
  readonly path = input.required<PresentationPath>();
  readonly pins = input.required<Pin[]>();
  readonly closed = output<void>();
  readonly index = signal(0);
  readonly title = pinTitle;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly size = signal({ width: 800, height: 600 });
  private observer?: ResizeObserver;
  private previousFocus: HTMLElement | null = null;
  readonly steps = computed(() => {
    const byId = new Map(this.pins().map((pin) => [pin.id, pin]));
    return this.path()
      .pinIds.map((id) => byId.get(id))
      .filter((pin): pin is Pin => !!pin);
  });
  readonly uniquePins = computed(() => [
    ...new Map(this.steps().map((pin) => [pin.id, pin])).values(),
  ]);
  readonly active = computed(() => this.steps()[Math.min(this.index(), this.steps().length - 1)]);
  readonly camera = computed(() => {
    const pin = this.active();
    if (!pin) return '';
    const { width, height } = this.size();
    const scale = Math.min((width - 32) / 420, (height - 32) / 480, 1.4);
    return `translate(${width / 2 - (pin.grid.x * 32 + 210) * scale}px, ${height / 2 - (pin.grid.y * 32 + 240) * scale}px) scale(${scale})`;
  });
  ngAfterViewInit() {
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.dialog().nativeElement.showModal();
    this.observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      this.size.set({ width: rect.width, height: rect.height });
    });
    this.observer.observe(this.viewport().nativeElement);
  }
  move(offset: number) {
    this.index.update((index) => Math.max(0, Math.min(this.steps().length - 1, index + offset)));
  }
  key(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.move(event.key === 'ArrowRight' ? 1 : -1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.index.set(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.index.set(Math.max(0, this.steps().length - 1));
    }
  }
  ngOnDestroy() {
    this.observer?.disconnect();
    if (this.dialog().nativeElement.open) this.dialog().nativeElement.close();
    this.previousFocus?.focus();
  }
}
