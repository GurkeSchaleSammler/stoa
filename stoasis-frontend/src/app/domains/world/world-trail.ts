import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../shared/ui/app-icon';
import { WorldApi } from './data/world.api';
import { WorldDetail } from './data/world.models';

@Component({
  selector: 'ui-world-trail',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    @if (world(); as active) {
      <nav class="world-trail" [attr.aria-label]="'worlds.navigation' | translate">
        <button type="button" class="world-home" (click)="openOverview()">
          <span aria-hidden="true">{{ active.emoji }}</span>
          <span
            ><small>{{ 'worlds.currentWorld' | translate }}</small
            ><strong>{{ active.name }}</strong></span
          >
        </button>
        <span class="trail-divider" aria-hidden="true"><ui-app-icon name="chevron-right" /></span>
        <label>
          <span class="sr-only">{{ 'worlds.chooseBoard' | translate }}</span>
          <select [value]="collectionId()" (change)="openBoard($event)">
            @for (board of active.boards; track board.id) {
              <option [value]="board.id">{{ board.emoji }} {{ board.name }}</option>
            }
          </select>
        </label>
        <button type="button" class="overview-button" (click)="openOverview()">
          <ui-app-icon name="map" /> {{ 'worlds.overview' | translate }}
        </button>
      </nav>
    }
  `,
  styleUrl: './world-trail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldTrailComponent {
  private readonly api = inject(WorldApi);
  private readonly router = inject(Router);
  readonly worldId = input.required<string>();
  readonly collectionId = input.required<string>();
  readonly world = signal<WorldDetail | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.worldId();
      if (!id) {
        this.world.set(null);
        return;
      }
      const subscription = this.api.detail(id).subscribe({
        next: (world) => this.world.set(world),
        error: () => this.world.set(null),
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  openOverview(): void {
    void this.router.navigate(['/worlds']);
  }

  openBoard(event: Event): void {
    const collectionId = (event.target as HTMLSelectElement).value;
    if (!collectionId || collectionId === this.collectionId()) return;
    void this.router.navigate(['/collections', collectionId], {
      queryParams: { world: this.worldId() },
    });
  }
}
