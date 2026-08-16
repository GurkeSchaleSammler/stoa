import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../shared/ui/app-icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly pointerX = signal(50);
  readonly pointerY = signal(24);
  readonly dotX = signal(0);
  readonly dotY = signal(0);

  trackPointer(event: PointerEvent): void {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    this.pointerX.set(x);
    this.pointerY.set(y);
    this.dotX.set((x - 50) * 0.12);
    this.dotY.set((y - 50) * 0.08);
  }
}
