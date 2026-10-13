import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, map, tap } from 'rxjs';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { PublicBoardPresentationComponent } from '../board/public-api';
import { PortalPinData } from '../../shared/models/portal-pin-data';
import { PublicWorldApi } from './data/world.api';
import { WorldBoardContent, WorldDetail } from './data/world.models';

@Component({
  selector: 'app-public-world-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent, PublicBoardPresentationComponent],
  template: `
    <main class="public-world-page">
      <nav class="public-nav">
        <a routerLink="/" class="brand"><img src="/android-chrome-192x192.png" alt="" /> Stoasis</a>
        <span><ui-app-icon name="map" /> {{ 'worlds.publicWorld' | translate }}</span>
      </nav>

      @if (status() === 'loading') {
        <section class="public-state">{{ 'worlds.loading' | translate }}</section>
      } @else if (status() !== 'ready') {
        <section class="public-state error" role="alert">
          <ui-app-icon name="warning" />
          <h1>{{ 'worlds.unavailable' | translate }}</h1>
          <p>{{ 'worlds.unavailableLead' | translate }}</p>
        </section>
      } @else if (world(); as currentWorld) {
        <header class="world-hero">
          <span>{{ currentWorld.emoji }}</span>
          <div>
            <p>{{ 'worlds.publicWorld' | translate }}</p>
            <h1>{{ currentWorld.name }}</h1>
            <small
              >{{ currentWorld.boards.length }} {{ 'worlds.boards' | translate }} ·
              {{ currentWorld.portals.length }} {{ 'worlds.portals' | translate }}</small
            >
          </div>
        </header>
        <nav class="board-trail" [attr.aria-label]="'worlds.boards' | translate">
          @for (board of currentWorld.boards; track board.id) {
            <button
              type="button"
              [class.active]="board.id === selectedBoardId()"
              (click)="openBoard(board.id)"
            >
              <span>{{ board.emoji }}</span
              ><strong>{{ board.name }}</strong>
              @if (board.isStart) {
                <small>{{ 'worlds.startBoard' | translate }}</small>
              }
            </button>
          }
        </nav>
        @if (boardContent(); as content) {
          <header class="board-heading">
            <span>{{ content.collection.emoji }}</span>
            <div>
              <p>{{ 'collection.readOnly' | translate }}</p>
              <h2>{{ content.collection.name }}</h2>
            </div>
          </header>
          @if (content.pins.length) {
            <ui-board-public-presentation
              [pins]="content.pins"
              (portalNavigate)="navigatePortal($event)"
            />
          } @else {
            <section class="public-state compact">{{ 'board.empty' | translate }}</section>
          }
        }
      }
    </main>
  `,
  styleUrl: './public-world-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicWorldPageComponent {
  private readonly api = inject(PublicWorldApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly worldId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  private readonly token = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('token') ?? undefined)),
    { initialValue: this.route.snapshot.queryParamMap.get('token') ?? undefined },
  );
  readonly world = signal<WorldDetail | null>(null);
  readonly boardContent = signal<WorldBoardContent | null>(null);
  readonly selectedBoardId = signal('');
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    effect(() => this.load(this.worldId(), this.token()));
  }

  openBoard(collectionId: string): void {
    if (!collectionId) return;
    this.selectedBoardId.set(collectionId);
    this.api
      .board(this.worldId(), collectionId, this.token())
      .pipe(
        tap((content) => this.boardContent.set(content)),
        catchError(() => {
          this.status.set('error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  navigatePortal(portal: PortalPinData): void {
    if (portal.worldId === this.worldId() && portal.targetCollectionId)
      this.openBoard(portal.targetCollectionId);
  }

  private load(id: string, token?: string): void {
    if (!id) return;
    this.status.set('loading');
    this.api
      .detail(id, token)
      .pipe(
        tap((world) => {
          this.world.set(world);
          this.status.set('ready');
          this.openBoard(world.startCollectionId);
        }),
        catchError(() => {
          this.status.set('error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
