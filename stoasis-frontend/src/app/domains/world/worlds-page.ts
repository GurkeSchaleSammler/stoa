import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../collection/data/application/collection.service';
import { ConfirmationDialogService } from '../../shared/application/confirmation-dialog.service';
import { SnackbarService } from '../../shared/application/snackbar.service';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { DialogComponent } from '../../shared/ui/dialog';
import { WorldStore } from './data/world.store';

@Component({
  selector: 'app-worlds-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent, DialogComponent],
  template: `
    <main class="worlds-page">
      <header class="worlds-header">
        <div>
          <p class="eyebrow">{{ 'worlds.eyebrow' | translate }}</p>
          <h1>{{ 'worlds.title' | translate }}</h1>
          <p>{{ 'worlds.lead' | translate }}</p>
        </div>
        <button class="button primary" type="button" (click)="openCreate()">
          <ui-app-icon name="plus" /> {{ 'worlds.create' | translate }}
        </button>
      </header>

      @if (worlds.isLoading() && !worlds.selected()) {
        <section class="world-empty" aria-live="polite">{{ 'common.loading' | translate }}</section>
      } @else if (worlds.worlds().length === 0) {
        <section class="world-empty">
          <span><ui-app-icon name="map" /></span>
          <h2>{{ 'worlds.emptyTitle' | translate }}</h2>
          <p>{{ 'worlds.emptyLead' | translate }}</p>
          <button class="button primary" type="button" (click)="openCreate()">
            {{ 'worlds.createFirst' | translate }}
          </button>
        </section>
      } @else {
        <div class="world-workspace">
          <aside class="world-list" [attr.aria-label]="'worlds.plural' | translate">
            @for (world of worlds.worlds(); track world.id) {
              <button
                type="button"
                [class.active]="worlds.selectedId() === world.id"
                (click)="worlds.loadDetail(world.id)"
              >
                <span class="world-list-emoji">{{ world.emoji }}</span>
                <span
                  ><strong>{{ world.name }}</strong
                  ><small>{{ world.boardCount }} {{ 'worlds.boards' | translate }}</small></span
                >
              </button>
            }
          </aside>

          @if (worlds.selected(); as world) {
            <section class="world-detail">
              <header class="world-detail-header">
                <div class="world-identity">
                  <span>{{ world.emoji }}</span>
                  <div>
                    <p>{{ visibilityKey(world.visibility) | translate }}</p>
                    <h2>{{ world.name }}</h2>
                  </div>
                </div>
                <div class="world-actions">
                  @if (shareUrl()) {
                    <button class="button secondary" type="button" (click)="copyShare()">
                      <ui-app-icon name="copy" /> {{ 'worlds.copyLink' | translate }}
                    </button>
                  }
                  <button
                    class="button primary"
                    type="button"
                    (click)="openBoard(world.startCollectionId)"
                  >
                    <ui-app-icon name="door" /> {{ 'worlds.enter' | translate }}
                  </button>
                </div>
              </header>

              <div class="world-limit" [class.premium]="world.limits.premium">
                <span><ui-app-icon name="map" /></span>
                <strong>{{ world.limits.boardCount }} / {{ world.limits.boardLimit }}</strong>
                <span>{{ 'worlds.boardLimit' | translate }}</span>
                @if (!world.limits.premium) {
                  <small>{{ 'worlds.premiumHint' | translate }}</small>
                }
              </div>

              <section class="world-map" [attr.aria-label]="'worlds.overview' | translate">
                <div class="world-map-caption">
                  <div>
                    <p class="eyebrow">{{ 'worlds.overview' | translate }}</p>
                    <h3>{{ 'worlds.mapTitle' | translate }}</h3>
                  </div>
                  <span>{{ world.portals.length }} {{ 'worlds.portals' | translate }}</span>
                </div>
                <div class="world-nodes">
                  @for (board of world.boards; track board.id) {
                    <article class="world-node" [class.start]="board.isStart">
                      @if (board.isStart) {
                        <span class="start-label">{{ 'worlds.startBoard' | translate }}</span>
                      }
                      <button type="button" class="node-main" (click)="openBoard(board.id)">
                        <span class="node-emoji">{{ board.emoji }}</span>
                        <span
                          ><strong>{{ board.name }}</strong
                          ><small
                            >{{ board.pinCount }} {{ 'common.pins' | translate }} ·
                            {{ board.backlinkCount }} {{ 'worlds.backlinks' | translate }}</small
                          ></span
                        >
                        <ui-app-icon name="chevron-right" />
                      </button>
                      <div class="node-actions">
                        @if (!board.isStart) {
                          <button
                            type="button"
                            (click)="worlds.update({ startCollectionId: board.id })"
                          >
                            {{ 'worlds.makeStart' | translate }}
                          </button>
                          <button type="button" class="danger-link" (click)="removeBoard(board.id)">
                            {{ 'common.remove' | translate }}
                          </button>
                        }
                      </div>
                    </article>
                  }
                </div>
                @if (world.portals.length === 0) {
                  <p class="portal-empty">
                    <ui-app-icon name="door" /> {{ 'worlds.portalEmpty' | translate }}
                  </p>
                } @else {
                  <div class="portal-edges">
                    @for (portal of world.portals; track portal.pinId) {
                      <span
                        >{{ boardName(portal.sourceCollectionId) }}
                        <ui-app-icon name="chevron-right" /> {{ portal.label }}</span
                      >
                    }
                  </div>
                }
              </section>

              <div class="world-panels">
                <section class="world-panel">
                  <h3>{{ 'worlds.addBoard' | translate }}</h3>
                  <p>{{ 'worlds.addBoardLead' | translate }}</p>
                  <div class="inline-form">
                    <select
                      [(ngModel)]="boardToAdd"
                      [attr.aria-label]="'worlds.chooseBoard' | translate"
                    >
                      <option value="">{{ 'worlds.chooseBoard' | translate }}</option>
                      @for (board of availableBoards(); track board.id) {
                        <option [value]="board.id">{{ board.emoji }} {{ board.name }}</option>
                      }
                    </select>
                    <button
                      class="button secondary"
                      type="button"
                      [disabled]="!boardToAdd"
                      (click)="addBoard()"
                    >
                      {{ 'common.add' | translate }}
                    </button>
                  </div>
                </section>

                <section class="world-panel">
                  <h3>{{ 'worlds.settings' | translate }}</h3>
                  <div class="settings-grid">
                    <label
                      ><span>{{ 'common.name' | translate }}</span
                      ><input [(ngModel)]="editName" maxlength="180"
                    /></label>
                    <label class="emoji-field"
                      ><span>{{ 'worlds.symbol' | translate }}</span
                      ><input [(ngModel)]="editEmoji" maxlength="32"
                    /></label>
                    <label
                      ><span>{{ 'collection.visibility' | translate }}</span>
                      <select [(ngModel)]="editVisibility">
                        <option value="private" [disabled]="!world.limits.premium">
                          {{ 'collection.private' | translate }} · Premium
                        </option>
                        <option value="link" [disabled]="!world.limits.premium">
                          {{ 'collection.viaLink' | translate }} · Premium
                        </option>
                        <option value="public">{{ 'collection.public' | translate }}</option>
                      </select>
                    </label>
                  </div>
                  <div class="settings-actions">
                    <button class="button danger" type="button" (click)="deleteWorld()">
                      {{ 'worlds.delete' | translate }}
                    </button>
                    <button
                      class="button primary"
                      type="button"
                      [disabled]="!canSave()"
                      (click)="saveSettings()"
                    >
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                </section>
              </div>
            </section>
          }
        </div>
      }
    </main>

    <ui-dialog
      [open]="createOpen()"
      title="worlds.create"
      [busy]="worlds.isSaving()"
      (closed)="createOpen.set(false)"
    >
      <div class="create-form">
        <label
          ><span>{{ 'common.name' | translate }}</span
          ><input
            [(ngModel)]="newName"
            maxlength="180"
            [placeholder]="'worlds.namePlaceholder' | translate"
        /></label>
        <label
          ><span>{{ 'worlds.symbol' | translate }}</span
          ><input [(ngModel)]="newEmoji" maxlength="32"
        /></label>
        <label
          ><span>{{ 'worlds.startBoard' | translate }}</span>
          <select [(ngModel)]="newStartBoardId">
            @for (board of ordinaryBoards(); track board.id) {
              <option [value]="board.id">{{ board.emoji }} {{ board.name }}</option>
            }
          </select>
        </label>
        <p class="form-hint">{{ 'worlds.freeLimitHint' | translate }}</p>
        <div class="dialog-actions">
          <button class="button secondary" type="button" (click)="createOpen.set(false)">
            {{ 'common.cancel' | translate }}
          </button>
          <button
            class="button primary"
            type="button"
            [disabled]="!newName.trim() || !newStartBoardId"
            (click)="createWorld()"
          >
            {{ 'worlds.create' | translate }}
          </button>
        </div>
      </div>
    </ui-dialog>
  `,
  styleUrl: './worlds-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldsPageComponent {
  protected readonly worlds = inject(WorldStore);
  private readonly collections = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly snackbars = inject(SnackbarService);
  readonly createOpen = signal(false);
  readonly ordinaryBoards = computed(() =>
    this.collections.collections().filter((board) => !board.isSystem),
  );
  readonly availableBoards = computed(() => {
    const connected = new Set(this.worlds.selected()?.boards.map((board) => board.id) ?? []);
    return this.ordinaryBoards().filter((board) => !connected.has(board.id));
  });
  readonly shareUrl = computed(() => {
    const world = this.worlds.selected();
    if (!world || world.visibility === 'private') return '';
    const url = new URL(`/shared/worlds/${encodeURIComponent(world.id)}`, window.location.origin);
    if (world.visibility === 'link' && world.shareToken)
      url.searchParams.set('token', world.shareToken);
    return url.toString();
  });
  newName = '';
  newEmoji = '🌐';
  newStartBoardId = '';
  boardToAdd = '';
  editName = '';
  editEmoji = '';
  editVisibility: 'private' | 'link' | 'public' = 'private';

  constructor() {
    this.collections.loadCollections();
    this.worlds.load();
    effect(() => {
      const world = this.worlds.selected();
      if (!world) return;
      this.editName = world.name;
      this.editEmoji = world.emoji;
      this.editVisibility = world.visibility;
    });
  }

  openCreate(): void {
    this.newStartBoardId = this.ordinaryBoards()[0]?.id ?? '';
    this.createOpen.set(true);
  }
  createWorld(): void {
    if (!this.newName.trim() || !this.newStartBoardId) return;
    this.worlds.create(
      { name: this.newName.trim(), emoji: this.newEmoji, startCollectionId: this.newStartBoardId },
      () => {
        this.createOpen.set(false);
        this.newName = '';
      },
    );
  }
  addBoard(): void {
    if (!this.boardToAdd) return;
    this.worlds.addBoard(this.boardToAdd);
    this.boardToAdd = '';
  }
  async removeBoard(id: string): Promise<void> {
    if (
      await this.confirmation.confirm({
        title: 'worlds.removeBoard',
        message: 'worlds.removeBoardConfirm',
      })
    )
      this.worlds.removeBoard(id);
  }
  canSave(): boolean {
    const world = this.worlds.selected();
    return (
      !!world &&
      !!this.editName.trim() &&
      (this.editName.trim() !== world.name ||
        this.editEmoji !== world.emoji ||
        this.editVisibility !== world.visibility)
    );
  }
  saveSettings(): void {
    if (!this.canSave()) return;
    this.worlds.update({
      name: this.editName.trim(),
      emoji: this.editEmoji,
      visibility: this.editVisibility,
    });
  }
  async deleteWorld(): Promise<void> {
    if (
      await this.confirmation.confirm({
        title: 'worlds.delete',
        message: 'worlds.deleteConfirm',
        confirmLabel: 'common.delete',
        tone: 'danger',
      })
    )
      this.worlds.delete();
  }
  openBoard(id: string): void {
    const worldId = this.worlds.selectedId();
    void this.router.navigate(['/collections', id], {
      queryParams: worldId ? { world: worldId } : undefined,
    });
  }
  boardName(id: string): string {
    return this.worlds.selected()?.boards.find((board) => board.id === id)?.name ?? '—';
  }
  visibilityKey(value: string): string {
    return value === 'public'
      ? 'worlds.public'
      : value === 'link'
        ? 'worlds.link'
        : 'worlds.private';
  }
  async copyShare(): Promise<void> {
    if (!this.shareUrl()) return;
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.snackbars.success('snackbar.shareLinkCopied');
    } catch {
      this.snackbars.error('errors.copyShareLink');
    }
  }
}
