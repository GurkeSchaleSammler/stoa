import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { PublicBoardPresentationComponent } from '../board/public-api';
import { PublicBoardStore } from './data/application/public-board.store';
import { map } from 'rxjs';

@Component({
  selector: 'app-public-board-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent, PublicBoardPresentationComponent],
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
          <span><ui-app-icon name="warning" /></span>
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
          <board-public-presentation
            [pins]="board.pins()"
            [attr.aria-label]="'common.pins' | translate"
          />
        } @else {
          <section class="public-state compact">
            <span><ui-app-icon name="grid" /></span>
            <h2>{{ 'board.empty' | translate }}</h2>
          </section>
        }
      }
    </main>
  `,
  styleUrl: './public-board-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBoardPageComponent {
  protected readonly board = inject(PublicBoardStore);
  private readonly route = inject(ActivatedRoute);
  private readonly collectionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  private readonly shareToken = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('token') ?? undefined)),
    { initialValue: this.route.snapshot.queryParamMap.get('token') ?? undefined },
  );

  constructor() {
    effect(() => this.board.load(this.collectionId(), this.shareToken()));
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
