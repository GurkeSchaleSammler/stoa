import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../domains/auth/data/application/auth-service';
import { CollectionListHandlerComponent } from '../domains/collection/feature/collection-list-handler';
import { LanguageService } from '../shared/application/language-service';
import { supportedAppLanguages } from '../shared/language.constants';
import { SessionContextStore } from '../shared/application/session-context.store';
import { AppIconComponent } from '../shared/ui/app-icon';

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
}
