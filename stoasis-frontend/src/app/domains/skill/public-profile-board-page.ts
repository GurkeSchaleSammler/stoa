import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, finalize } from 'rxjs';
import { ProfileBoardApi } from './data/profile-board.api';
import { ProfileBoard } from './data/profile-board.models';

/** Presents a shared profile as a read-only skill board. */
@Component({
  selector: 'app-public-profile-board-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="public-skills-page">
      <a class="public-brand" routerLink="/">Stoasis</a>
      @if (isLoading()) {
        <p>{{ 'common.loading' | translate }}</p>
      } @else if (board(); as item) {
        <section class="public-board-card" [style.--profile-accent]="item.accent">
          <p class="eyebrow">{{ 'skills.publicProfile' | translate }}</p>
          <h1>{{ item.ownerName }}</h1>
          <h2>{{ item.boardKind === 'WORK' ? '💼 Work' : '🌿 Personal' }}</h2>
          <div class="public-board-viewport">
            <div class="public-skill-board">
              @for (skill of item.skills; track skill.id) {
                <article
                  class="skill-pin"
                  [style.left.px]="skill.grid.x * clipSize"
                  [style.top.px]="skill.grid.y * clipSize"
                  [style.width.px]="skill.grid.width * clipSize"
                  [style.min-height.px]="skill.grid.heightClips * clipSize"
                  [style.z-index]="skill.grid.layer"
                >
                  <span class="skill-pin-type" aria-hidden="true">✦</span>
                  <strong>{{ skill.skillName }}</strong>
                  <span class="level-pill">{{
                    'skills.levelValue.' + skill.level | translate
                  }}</span>
                  @if (skill.yearsExperience !== null) {
                    <small>{{
                      'skills.yearsValue' | translate: { count: skill.yearsExperience }
                    }}</small>
                  }
                </article>
              } @empty {
                <div class="empty-state">
                  <h2>{{ 'skills.emptyTitle' | translate }}</h2>
                </div>
              }
            </div>
          </div>
        </section>
      } @else {
        <section class="public-board-card">
          <h1>{{ 'skills.unavailable' | translate }}</h1>
        </section>
      }
    </main>
  `,
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfileBoardPageComponent implements OnInit {
  private readonly api = inject(ProfileBoardApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly board = signal<ProfileBoard | null>(null);
  readonly isLoading = signal(true);
  readonly clipSize = 10;

  ngOnInit(): void {
    this.api
      .publicView(
        this.route.snapshot.paramMap.get('id')!,
        this.route.snapshot.queryParamMap.get('token'),
      )
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((board) => this.board.set(board));
  }
}
