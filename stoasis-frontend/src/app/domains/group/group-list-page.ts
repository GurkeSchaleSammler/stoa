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
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY, finalize } from 'rxjs';
import { SnackbarService } from '../../shared/application/snackbar.service';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { GroupApi } from './data/group.api';
import { GroupSummary } from './data/group.models';

@Component({
  selector: 'app-group-list-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AppIconComponent],
  template: `
    <main class="groups-page">
      <header class="groups-header">
        <div>
          <p class="eyebrow">{{ 'groups.eyebrow' | translate }}</p>
          <h1>{{ 'groups.title' | translate }}</h1>
          <p>{{ 'groups.lead' | translate }}</p>
        </div>
        <form class="create-group" (ngSubmit)="create()">
          <input
            name="groupName"
            required
            maxlength="120"
            [(ngModel)]="groupName"
            [placeholder]="'groups.namePlaceholder' | translate"
          />
          <button type="submit" [disabled]="!groupName.trim() || isSaving()">
            <ui-app-icon name="plus" /> {{ 'groups.create' | translate }}
          </button>
        </form>
      </header>

      @if (isLoading()) {
        <p>{{ 'common.loading' | translate }}</p>
      } @else {
        <section class="group-grid">
          @for (group of groups(); track group.id) {
            <a [routerLink]="['/groups', group.id]" class="group-card">
              <span class="group-mark" aria-hidden="true">{{
                group.name.slice(0, 1).toUpperCase()
              }}</span>
              <div>
                <h2>{{ group.name }}</h2>
                <p>{{ 'groups.memberCount' | translate: { count: group.memberCount } }}</p>
              </div>
              <span class="sharing-badge sharing-{{ group.mySharingPreference.toLowerCase() }}">
                {{ 'groups.sharingValue.' + group.mySharingPreference | translate }}
              </span>
            </a>
          } @empty {
            <div class="group-empty">
              <h2>{{ 'groups.emptyTitle' | translate }}</h2>
              <p>{{ 'groups.emptyLead' | translate }}</p>
            </div>
          }
        </section>
      }
    </main>
  `,
  styleUrl: './groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListPageComponent implements OnInit {
  private readonly api = inject(GroupApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  readonly groups = signal<GroupSummary[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  groupName = '';

  ngOnInit(): void {
    this.api
      .list()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((groups) => this.groups.set(groups));
  }

  create(): void {
    const name = this.groupName.trim();
    if (!name) return;
    this.isSaving.set(true);
    this.api
      .create(name)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        catchError(() => this.fail()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((group) => void this.router.navigate(['/groups', group.id]));
  }

  private fail() {
    this.snackbars.error('errors.groups');
    return EMPTY;
  }
}
