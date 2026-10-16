import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardElements } from '../models/board-elements';
import { initialBoardElements } from '../models/initial-board-elements';
import { StackBlock } from '../models/stack-block';

@Injectable({ providedIn: 'root' })
export class BoardElementsStore {
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<BoardElements>(initialBoardElements);
  private readonly errorState = signal<string | null>(null);

  readonly elements = this.state.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly stacks = computed(() => this.state().stacks);
  readonly connectors = computed(() => this.state().connectors);
  readonly zones = computed(() => this.state().zones);
  readonly labels = computed(() => this.state().labels);
  readonly stickers = computed(() => this.state().stickers);

  reset(): void {
    this.state.set(initialBoardElements);
    this.errorState.set(null);
  }

  set(elements: BoardElements): void {
    this.state.set(elements);
    this.errorState.set(null);
  }

  update(update: (elements: BoardElements) => BoardElements): void {
    this.state.update(update);
  }

  replaceStack(stack: StackBlock): void {
    this.update((elements) => ({
      ...elements,
      stacks: elements.stacks.map((current) => (current.id === stack.id ? stack : current)),
    }));
  }

  replaceInList<K extends 'zones' | 'labels' | 'stickers', T extends { id: string }>(
    key: K,
    id: string,
    element: T,
  ): void {
    this.update((elements) => ({
      ...elements,
      [key]: (elements[key] as unknown as T[]).map((current) =>
        current.id === id ? element : current,
      ),
    }));
  }

  removeFromList(key: 'zones' | 'labels' | 'stickers', id: string): void {
    this.update((elements) => ({
      ...elements,
      [key]: elements[key].filter((element) => element.id !== id),
    }));
  }

  handleError(error: unknown): Observable<never> {
    const body = (error as { error?: { code?: string; message?: string } })?.error;
    const message = body?.code?.startsWith('board.')
      ? body.code
      : (body?.message ?? 'errors.board');
    this.errorState.set(message);
    this.snackbars.error(message);
    return EMPTY;
  }
}
