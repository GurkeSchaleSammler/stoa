import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionService } from '../data/application/collection.service';
import { CollectionToolbarComponent } from '../ui/collection-toolbar';
import { BoardViewMode } from '../../../shared/models/board-view-mode';

@Component({
  selector: 'feature-collection-toolbar-handler',
  standalone: true,
  imports: [CollectionToolbarComponent],
  template: `
    <ui-collection-toolbar
      [collection]="collections.activeCollection()"
      [viewMode]="viewMode()"
      [canEdit]="collections.canEditActive()"
      (onViewModeChange)="changeView($event)"
      (onInviteClick)="openMembers()"
      (onSettingsClick)="openSettings()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionToolbarHandlerComponent {
  protected readonly collections = inject(CollectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly viewMode = signal<BoardViewMode>('board');
  constructor() {
    this.collections.loadCollection(this.id);
  }
  changeView(mode: BoardViewMode): void {
    this.viewMode.set(mode);
  }
  openMembers(): void {
    void this.router.navigate(['/collections', this.id, 'members']);
  }
  openSettings(): void {
    void this.router.navigate(['/collections', this.id, 'settings']);
  }
}
