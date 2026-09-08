import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { MembershipApi } from '../api/membership.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { initialMembershipState } from '../models/initial-membership-state';
import { MembershipState } from '../models/membership-state';
import { canManage } from '../../../../shared/models/can-manage';
import { Role } from '../../../../shared/models/role';
import { canEdit } from '../../../../shared/models/can-edit';

/** Loads members and applies authorized role and invitation changes. */
@Injectable({ providedIn: 'root' })
export class MembershipService {
  private readonly api = inject(MembershipApi);
  private readonly session = inject(SessionContextStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<MembershipState>(initialMembershipState);

  readonly members = computed(() => this.state().members);
  readonly invite = computed(() => this.state().invite);
  readonly status = computed(() => this.state().status);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly isMutating = computed(() => this.state().isMutating);
  readonly error = computed(() => this.state().error);
  readonly currentUserRole = computed(
    () =>
      this.state().members.find((member) => member.userId === this.session.userId())?.role ?? null,
  );
  readonly canEdit = computed(() => canEdit(this.currentUserRole()));
  readonly canManageMembers = computed(() => canManage(this.currentUserRole()));

  loadMembers(collectionId: string): void {
    this.state.update((state) => ({ ...state, status: 'loading', error: null }));
    this.api
      .list(collectionId)
      .pipe(
        tap((members) => this.state.update((state) => ({ ...state, members, status: 'idle' }))),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadInvite(collectionId: string): void {
    this.api
      .invite(collectionId)
      .pipe(
        tap((invite) => this.state.update((state) => ({ ...state, invite }))),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadInvitePreview(token: string): void {
    this.state.update((state) => ({ ...state, status: 'loading', error: null }));
    this.api
      .invitePreview(token)
      .pipe(
        tap((invite) => {
          this.state.update((state) => ({ ...state, invite, status: 'idle' }));
        }),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateRole(collectionId: string, userId: string, role: Role): void {
    this.setMutating(true);
    this.api
      .updateRole(collectionId, userId, role)
      .pipe(
        tap((updated) => {
          this.state.update((state) => ({
            ...state,
            members: state.members.map((member) => (member.userId === userId ? updated : member)),
          }));
          this.loadInvite(collectionId);
          this.snackbars.success('snackbar.memberRoleUpdated');
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  removeMember(collectionId: string, userId: string): void {
    const member = this.state().members.find((item) => item.userId === userId);
    const ownerCount = this.state().members.filter((item) => item.role === 'owner').length;
    if (member?.role === 'owner' && ownerCount <= 1) {
      this.state.update((state) => ({
        ...state,
        error: 'errors.lastOwner',
      }));
      this.snackbars.error('errors.lastOwner');
      return;
    }
    this.setMutating(true);
    this.api
      .remove(collectionId, userId)
      .pipe(
        tap(() => {
          this.state.update((state) => ({
            ...state,
            members: state.members.filter((item) => item.userId !== userId),
          }));
          this.loadInvite(collectionId);
          this.snackbars.success('snackbar.memberRemoved');
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  setInviteVisibility(collectionId: string, visibility: 'private' | 'link'): void {
    this.setMutating(true);
    this.api
      .setVisibility(collectionId, visibility)
      .pipe(
        tap((invite) => {
          this.state.update((state) => ({ ...state, invite }));
          this.snackbars.success(
            visibility === 'link' ? 'snackbar.inviteEnabled' : 'snackbar.inviteDisabled',
          );
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  joinViaToken(token: string): void {
    this.setMutating(true);
    this.api
      .join(token)
      .pipe(
        tap(({ collectionId }) => {
          this.snackbars.success('snackbar.collectionJoined');
          void this.router.navigate(['/collections', collectionId]);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearError(): void {
    this.state.update((state) => ({ ...state, error: null }));
  }
  private setMutating(isMutating: boolean): void {
    this.state.update((state) => ({ ...state, isMutating }));
  }
  private handleError(error: unknown) {
    const message =
      (error as { error?: { message?: string } })?.error?.message ?? 'errors.membership';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
