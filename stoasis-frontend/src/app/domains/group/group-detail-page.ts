import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, finalize, forkJoin } from 'rxjs';
import { SessionContextStore } from '../../shared/application/session-context.store';
import { SnackbarService } from '../../shared/application/snackbar.service';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { GroupApi } from './data/group.api';
import { GroupDetail, GroupSkillMember, SharingPreference } from './data/group.models';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AppIconComponent],
  template: `
    <main class="groups-page group-detail-page">
      <a class="back-link" routerLink="/groups">← {{ 'groups.back' | translate }}</a>
      @if (isLoading()) {
        <p>{{ 'common.loading' | translate }}</p>
      } @else if (group(); as item) {
        <header class="detail-header">
          <div>
            <p class="eyebrow">{{ 'groups.group' | translate }}</p>
            <h1>{{ item.name }}</h1>
            <p>{{ 'groups.memberCount' | translate: { count: item.members.length } }}</p>
          </div>
          @if (item.inviteToken) {
            <button type="button" class="invite-button" (click)="copyInvite(item.inviteToken)">
              <ui-app-icon name="copy" /> {{ 'groups.copyInvite' | translate }}
            </button>
          }
        </header>

        <section class="sharing-panel">
          <div>
            <h2>{{ 'groups.yourSharing' | translate }}</h2>
            <p>{{ 'groups.yourSharingLead' | translate }}</p>
          </div>
          <select
            [ngModel]="item.mySharingPreference"
            [disabled]="isSaving()"
            (ngModelChange)="updateSharing($event)"
          >
            @for (option of sharingOptions; track option) {
              <option [ngValue]="option">{{ 'groups.sharingValue.' + option | translate }}</option>
            }
          </select>
        </section>

        <section class="matrix-card">
          <div class="section-heading">
            <h2>{{ 'groups.matrixTitle' | translate }}</h2>
            <p>{{ 'groups.matrixLead' | translate }}</p>
          </div>
          @for (member of skills(); track member.userId) {
            <article class="matrix-row">
              <div class="member-name">
                <span>{{ member.name.slice(0, 1).toUpperCase() }}</span>
                <strong>{{ member.name }}</strong>
              </div>
              <div class="skill-cloud">
                @for (skill of member.skills; track skill.pinId) {
                  <span class="skill-tag kind-{{ skill.boardKind.toLowerCase() }}">
                    <b>{{ skill.skillName }}</b>
                    <small>{{ 'skills.levelValue.' + skill.level | translate }}</small>
                  </span>
                }
              </div>
            </article>
          } @empty {
            <div class="matrix-empty">
              <h3>{{ 'groups.noSharedSkills' | translate }}</h3>
              <p>{{ 'groups.noSharedSkillsLead' | translate }}</p>
            </div>
          }
        </section>

        <section class="members-card">
          <h2>{{ 'groups.members' | translate }}</h2>
          <div class="member-list">
            @for (member of item.members; track member.userId) {
              <span>{{ member.name }}</span>
            }
          </div>
        </section>

        <div class="danger-actions">
          @if (item.ownerId === session.user()?.id) {
            <button type="button" (click)="deleteGroup()">{{ 'groups.delete' | translate }}</button>
          } @else {
            <button type="button" (click)="leaveGroup()">{{ 'groups.leave' | translate }}</button>
          }
        </div>
      }
    </main>
  `,
  styleUrl: './groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailPageComponent implements OnInit {
  private readonly api = inject(GroupApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  protected readonly session = inject(SessionContextStore);
  readonly group = signal<GroupDetail | null>(null);
  readonly skills = signal<GroupSkillMember[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly sharingOptions: SharingPreference[] = ['NONE', 'WORK_ONLY', 'PERSONAL_ONLY', 'BOTH'];
  private readonly groupId = this.route.snapshot.paramMap.get('id')!;

  ngOnInit(): void {
    this.reload();
  }

  updateSharing(preference: SharingPreference): void {
    this.isSaving.set(true);
    this.api
      .updateSharing(this.groupId, preference)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((group) => {
        this.group.set(group);
        this.loadSkills();
      });
  }

  copyInvite(token: string): void {
    void navigator.clipboard.writeText(
      new URL(`/groups/join/${token}`, window.location.origin).toString(),
    );
    this.snackbars.success('common.copied');
  }

  leaveGroup(): void {
    this.api
      .leave(this.groupId)
      .pipe(
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => void this.router.navigateByUrl('/groups'));
  }

  deleteGroup(): void {
    this.api
      .delete(this.groupId)
      .pipe(
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => void this.router.navigateByUrl('/groups'));
  }

  private reload(): void {
    forkJoin({ group: this.api.detail(this.groupId), skills: this.api.skills(this.groupId) })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ group, skills }) => {
        this.group.set(group);
        this.skills.set(skills);
      });
  }

  private loadSkills(): void {
    this.api
      .skills(this.groupId)
      .pipe(
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((skills) => this.skills.set(skills));
  }

  private fail() {
    this.snackbars.error('errors.groups');
    return EMPTY;
  }
}
