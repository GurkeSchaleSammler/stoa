import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../domains/auth/data/application/auth-service';
import { CollectionListHandlerComponent } from '../domains/collection/feature/collection-list-handler';
import { LanguageService } from '../shared/application/language-service';
import { supportedAppLanguages } from '../shared/language.constants';
import { SessionContextStore } from '../shared/application/session-context.store';
import { AppIconComponent } from '../shared/ui/app-icon';
import { FeatureFlagsService } from '../shared/application/feature-flags.service';
import { ViewportService } from '../shared/application/viewport.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CollectionListHandlerComponent,
    TranslatePipe,
    AppIconComponent,
  ],
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceShellComponent {
  protected readonly session = inject(SessionContextStore);
  protected readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  protected readonly languages = supportedAppLanguages;
  protected readonly features = inject(FeatureFlagsService);
  protected readonly viewport = inject(ViewportService);
  protected readonly mobilePanel = signal<'collections' | 'account' | null>(null);
  private readonly mobileSheet = viewChild<ElementRef<HTMLDialogElement>>('mobileSheet');

  constructor() {
    this.features.load();
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobilePanel.set(null));
    effect((onCleanup) => {
      const sheet = this.mobileSheet()?.nativeElement;
      if (!this.viewport.compact()) this.mobilePanel.set(null);
      if (!sheet) return;
      if (this.mobilePanel()) {
        const frame = window.requestAnimationFrame(() => {
          if (sheet.isConnected && !sheet.open) sheet.showModal();
        });
        onCleanup(() => window.cancelAnimationFrame(frame));
      } else if (sheet.open) {
        sheet.close();
      }
    });
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    const sheet = this.mobileSheet()?.nativeElement;
    if (event.target !== sheet || !sheet) return;
    const rect = sheet.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.mobilePanel.set(null);
  }
}
