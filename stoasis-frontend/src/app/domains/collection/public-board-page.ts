import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { PinDetailComponent } from '../board/ui/pin-detail';
import { PinCardComponent } from '../board/ui/pin-card';
import { ImageFullViewComponent } from '../board/ui/image-full-view';
import { ImageFullView } from '../board/ui/models/image-full-view';
import { PublicBoardStore } from './data/application/public-board.store';
import { Pin } from '../../shared/models/pin';
import { PinEditValue } from '../board/data/models/pin-edit-value';

@Component({
  selector: 'app-public-board-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    AppIconComponent,
    PinCardComponent,
    PinDetailComponent,
    ImageFullViewComponent,
  ],
  providers: [PublicBoardStore],
  template: `
    <main class="public-board-page">
      <nav class="public-nav" [attr.aria-label]="'shell.home' | translate">
        <a routerLink="/" class="public-brand"
          ><img src="/android-chrome-192x192.png" alt="" /> Stoasis</a
        >
        <span><ui-app-icon name="eye" /> {{ 'collection.readOnly' | translate }}</span>
      </nav>

      @if (board.status() === 'loading') {
        <section class="public-state" aria-live="polite">
          <div class="public-spinner" aria-hidden="true"></div>
          <p>{{ 'collection.publicLoading' | translate }}</p>
        </section>
      } @else if (board.status() !== 'ready') {
        <section class="public-state" role="alert">
          <span
            ><ui-app-icon [name]="board.status() === 'forbidden' ? 'eye-off' : 'warning'"
          /></span>
          <h1>{{ errorTitleKey() | translate }}</h1>
          <p>{{ errorTextKey() | translate }}</p>
          <a routerLink="/auth/login">{{ 'auth.login' | translate }}</a>
        </section>
      } @else if (board.collection(); as collection) {
        <header class="public-board-header">
          <span class="public-board-emoji" aria-hidden="true">{{ collection.emoji }}</span>
          <div>
            <p class="public-kicker">
              {{
                (collection.visibility === 'public'
                  ? 'collection.publicBoard'
                  : 'collection.linkBoard'
                ) | translate
              }}
            </p>
            <h1>{{ collection.name }}</h1>
            <p>{{ 'collection.publicReadOnlyHint' | translate }}</p>
          </div>
          <span class="public-pin-count"
            >{{ collection.pinCount }} {{ 'common.pins' | translate }}</span
          >
        </header>

        @if (board.pins().length) {
          <section class="public-pin-grid" [attr.aria-label]="'common.pins' | translate">
            @for (pin of board.pins(); track pin.id) {
              <ui-pin-card
                [pin]="pin"
                [selected]="selectedPin()?.id === pin.id"
                (onOpen)="selectPin($event)"
                (onImageFullView)="imageFullView.set($event)"
              />
            }
          </section>
        } @else {
          <section class="public-state compact">
            <span><ui-app-icon name="grid" /></span>
            <h2>{{ 'board.empty' | translate }}</h2>
          </section>
        }
      }
    </main>

    @if (selectedPin(); as pin) {
      <ui-pin-detail
        [pin]="pin"
        [canEdit]="false"
        [canComment]="false"
        [editValue]="emptyEditValue"
        (onClose)="selectedPin.set(null)"
      />
    }
    @if (imageFullView(); as image) {
      <ui-image-full-view [image]="image" (close)="imageFullView.set(null)" />
    }
  `,
  styleUrl: './public-board-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBoardPageComponent {
  protected readonly board = inject(PublicBoardStore);
  private readonly route = inject(ActivatedRoute);
  readonly selectedPin = signal<Pin | null>(null);
  readonly imageFullView = signal<ImageFullView | null>(null);
  readonly emptyEditValue: PinEditValue = {
    title: '',
    description: '',
    content: '',
    color: '',
    pinColor: null,
    caption: '',
    tags: '',
  };

  constructor() {
    this.board.load(
      this.route.snapshot.paramMap.get('id') ?? '',
      this.route.snapshot.queryParamMap.get('token') ?? undefined,
    );
  }

  selectPin(id: string): void {
    this.selectedPin.set(this.board.pins().find((pin) => pin.id === id) ?? null);
  }

  errorTitleKey(): string {
    if (this.board.status() === 'forbidden') return 'collection.publicForbiddenTitle';
    if (this.board.status() === 'not-found') return 'collection.publicNotFoundTitle';
    return 'collection.publicErrorTitle';
  }

  errorTextKey(): string {
    if (this.board.status() === 'forbidden') return 'collection.publicForbiddenText';
    if (this.board.status() === 'not-found') return 'collection.publicNotFoundText';
    return 'collection.publicErrorText';
  }
}
