import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/core.models';

@Injectable({ providedIn: 'root' })
export class SessionContextStore {
  private readonly currentUser = signal<User | null>(null);

  readonly user = computed(() => this.currentUser());
  readonly userId = computed(() => this.currentUser()?.id ?? null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  setUser(user: User | null): void {
    this.currentUser.set(user);
  }
}
