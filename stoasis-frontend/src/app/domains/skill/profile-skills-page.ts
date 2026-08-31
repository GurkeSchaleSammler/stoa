import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, finalize } from 'rxjs';
import { SnackbarService } from '../../shared/application/snackbar.service';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { ProfileBoardApi } from './data/profile-board.api';
import {
  BoardKind,
  ProfileBoard,
  ProfileBoardVisibility,
  ProfileSkill,
  SkillGrid,
  SkillLevel,
} from './data/profile-board.models';

interface SkillDragState {
  pinId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  origin: SkillGrid;
}

@Component({
  selector: 'app-profile-skills-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    <main class="skills-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">{{ 'skills.eyebrow' | translate }}</p>
          <h1>{{ 'skills.title' | translate }}</h1>
          <p>{{ 'skills.lead' | translate }}</p>
        </div>
      </header>

      <div class="board-tabs" role="tablist" [attr.aria-label]="'skills.boards' | translate">
        @for (kind of boardKinds; track kind) {
          <button
            type="button"
            role="tab"
            [class.active]="activeKind() === kind"
            [attr.aria-selected]="activeKind() === kind"
            (click)="activeKind.set(kind); resetForm()"
          >
            {{ kind === 'WORK' ? '💼 Work' : '🌿 Personal' }}
          </button>
        }
      </div>

      @if (isLoading()) {
        <p class="state-copy">{{ 'common.loading' | translate }}</p>
      } @else if (activeBoard(); as board) {
        <section class="visibility-card">
          <div>
            <strong>{{ 'skills.visibility' | translate }}</strong>
            <span>{{ 'skills.visibilityLead' | translate }}</span>
          </div>
          <div class="visibility-actions">
            @for (option of visibilityOptions; track option) {
              <button
                type="button"
                [class.active]="board.visibility === option"
                [disabled]="isSaving() || isVisibilityOptionDisabled(option)"
                (click)="setVisibility(option)"
              >
                {{ 'skills.visibilityValue.' + option | translate }}
              </button>
            }
          </div>
        </section>

        <section class="skill-layout">
          <form class="skill-form" (ngSubmit)="saveSkill()">
            <h2>{{ (editingId() ? 'skills.edit' : 'skills.add') | translate }}</h2>
            <label>
              <span>{{ 'skills.name' | translate }}</span>
              <input
                name="skillName"
                maxlength="120"
                required
                [(ngModel)]="skillName"
                [placeholder]="'skills.namePlaceholder' | translate"
              />
            </label>
            <label>
              <span>{{ 'skills.level' | translate }}</span>
              <select name="level" [(ngModel)]="level">
                @for (option of levels; track option) {
                  <option [ngValue]="option">
                    {{ 'skills.levelValue.' + option | translate }}
                  </option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'skills.years' | translate }}</span>
              <input name="years" type="number" min="0" max="80" [(ngModel)]="yearsExperience" />
            </label>
            <div class="form-actions">
              @if (editingId()) {
                <button type="button" class="secondary" (click)="resetForm()">
                  {{ 'common.cancel' | translate }}
                </button>
              }
              <button type="submit" class="primary" [disabled]="!skillName.trim() || isSaving()">
                <ui-app-icon name="plus" />
                {{ (isSaving() ? 'common.saving' : 'common.save') | translate }}
              </button>
            </div>
          </form>

          <section class="skill-board-panel" [attr.aria-label]="'skills.board' | translate">
            <header class="skill-board-header">
              <div>
                <h2>{{ board.name }}</h2>
                <p>{{ 'skills.boardLead' | translate }}</p>
              </div>
              <span>{{ board.skills.length }} {{ 'skills.nav' | translate }}</span>
            </header>
            <div class="skill-board-viewport">
              <div
                class="skill-board"
                (pointermove)="moveDrag($event)"
                (pointerup)="endDrag($event)"
                (pointercancel)="cancelDrag()"
              >
                @if (board.skills.length === 0) {
                  <div class="empty-state">
                    <span aria-hidden="true">✦</span>
                    <h2>{{ 'skills.emptyTitle' | translate }}</h2>
                    <p>{{ 'skills.emptyLead' | translate }}</p>
                  </div>
                }
                @for (skill of board.skills; track skill.id) {
                  <article
                    class="skill-pin"
                    [class.dragging]="dragState()?.pinId === skill.id"
                    [style.left.px]="skill.grid.x * clipSize"
                    [style.top.px]="skill.grid.y * clipSize"
                    [style.width.px]="skill.grid.width * clipSize"
                    [style.min-height.px]="skill.grid.heightClips * clipSize"
                    [style.z-index]="skill.grid.layer"
                    (pointerdown)="startDrag($event, skill)"
                  >
                    <span class="skill-pin-type" aria-hidden="true">✦</span>
                    <strong>{{ skill.skillName }}</strong>
                    <span class="level-pill level-{{ skill.level.toLowerCase() }}">
                      {{ 'skills.levelValue.' + skill.level | translate }}
                    </span>
                    @if (skill.yearsExperience !== null) {
                      <small>{{
                        'skills.yearsValue' | translate: { count: skill.yearsExperience }
                      }}</small>
                    }
                    <div class="pin-actions">
                      <button
                        type="button"
                        [attr.aria-label]="'common.edit' | translate"
                        (pointerdown)="$event.stopPropagation()"
                        (click)="editSkill(skill.id)"
                      >
                        <ui-app-icon name="edit" />
                      </button>
                      <button
                        type="button"
                        [attr.aria-label]="'common.delete' | translate"
                        (pointerdown)="$event.stopPropagation()"
                        (click)="deleteSkill(skill.id)"
                      >
                        <ui-app-icon name="trash" />
                      </button>
                    </div>
                  </article>
                }
              </div>
            </div>
          </section>
        </section>
      }
    </main>
  `,
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSkillsPageComponent implements OnInit {
  private readonly api = inject(ProfileBoardApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);

  readonly boards = signal<ProfileBoard[]>([]);
  readonly activeKind = signal<BoardKind>('WORK');
  readonly activeBoard = computed(() =>
    this.boards().find((board) => board.boardKind === this.activeKind()),
  );
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly dragState = signal<SkillDragState | null>(null);
  readonly boardKinds: BoardKind[] = ['WORK', 'PERSONAL'];
  readonly levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  readonly visibilityOptions: ProfileBoardVisibility[] = ['private', 'link', 'public'];
  readonly clipSize = 10;

  skillName = '';
  level: SkillLevel = 'INTERMEDIATE';
  yearsExperience: number | null = null;

  ngOnInit(): void {
    this.api
      .list()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((boards) => this.boards.set(boards));
  }

  saveSkill(): void {
    const name = this.skillName.trim();
    if (!name) return;
    const body = { skillName: name, level: this.level, yearsExperience: this.yearsExperience };
    const request = this.editingId()
      ? this.api.updateSkill(this.activeKind(), this.editingId()!, body)
      : this.api.createSkill(this.activeKind(), body);
    this.isSaving.set(true);
    request
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((board) => {
        this.replaceBoard(board);
        this.resetForm();
        this.snackbars.success('skills.saved');
      });
  }

  editSkill(id: string): void {
    const skill = this.activeBoard()?.skills.find((item) => item.id === id);
    if (!skill) return;
    this.editingId.set(id);
    this.skillName = skill.skillName;
    this.level = skill.level;
    this.yearsExperience = skill.yearsExperience;
  }

  deleteSkill(id: string): void {
    this.isSaving.set(true);
    this.api
      .deleteSkill(this.activeKind(), id)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((board) => {
        this.replaceBoard(board);
        if (this.editingId() === id) this.resetForm();
      });
  }

  startDrag(event: PointerEvent, skill: ProfileSkill): void {
    if (event.button !== 0 || this.isSaving()) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragState.set({
      pinId: skill.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: { ...skill.grid },
    });
  }

  moveDrag(event: PointerEvent): void {
    const drag = this.dragState();
    if (!drag || event.pointerId !== drag.pointerId) return;
    const x = this.clamp(
      drag.origin.x + Math.round((event.clientX - drag.startClientX) / this.clipSize),
      0,
      160 - drag.origin.width,
    );
    const y = this.clamp(
      drag.origin.y + Math.round((event.clientY - drag.startClientY) / this.clipSize),
      0,
      240 - drag.origin.heightClips,
    );
    this.updateSkillGrid(drag.pinId, { ...drag.origin, x, y });
  }

  endDrag(event: PointerEvent): void {
    const drag = this.dragState();
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = this.activeBoard()?.skills.find((skill) => skill.id === drag.pinId);
    this.dragState.set(null);
    if (!current || (current.grid.x === drag.origin.x && current.grid.y === drag.origin.y)) return;
    this.isSaving.set(true);
    this.api
      .moveSkill(this.activeKind(), drag.pinId, {
        x: current.grid.x,
        y: current.grid.y,
        heightClips: current.grid.heightClips,
        layer: current.grid.layer,
      })
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => {
          this.updateSkillGrid(drag.pinId, drag.origin);
          return this.fail();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((board) => this.replaceBoard(board));
  }

  cancelDrag(): void {
    const drag = this.dragState();
    if (!drag) return;
    this.updateSkillGrid(drag.pinId, drag.origin);
    this.dragState.set(null);
  }

  setVisibility(visibility: ProfileBoardVisibility): void {
    if (this.isVisibilityOptionDisabled(visibility)) return;
    if (visibility === this.activeBoard()?.visibility) return;
    this.isSaving.set(true);
    this.api
      .setVisibility(this.activeKind(), visibility)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((board) => this.replaceBoard(board));
  }

  copyShareLink(board: ProfileBoard): void {
    const url = new URL(`/profile-boards/${board.id}`, window.location.origin);
    if (board.visibility === 'link' && board.shareToken)
      url.searchParams.set('token', board.shareToken);
    void navigator.clipboard.writeText(url.toString());
    this.snackbars.success('common.copied');
  }

  resetForm(): void {
    this.editingId.set(null);
    this.skillName = '';
    this.level = 'INTERMEDIATE';
    this.yearsExperience = null;
  }

  private replaceBoard(board: ProfileBoard): void {
    this.boards.update((items) =>
      items.map((item) => (item.boardKind === board.boardKind ? board : item)),
    );
  }

  private updateSkillGrid(pinId: string, grid: SkillGrid): void {
    this.boards.update((boards) =>
      boards.map((board) =>
        board.boardKind !== this.activeKind()
          ? board
          : {
              ...board,
              skills: board.skills.map((skill) =>
                skill.id === pinId ? { ...skill, grid } : skill,
              ),
            },
      ),
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  isVisibilityOptionDisabled(visibility: ProfileBoardVisibility): boolean {
    return visibility !== 'private';
  }

  private fail() {
    this.snackbars.error('errors.skills');
    return EMPTY;
  }
}
