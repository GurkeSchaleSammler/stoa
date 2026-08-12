import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrefsStore } from './domains/profile/data/application/prefs.store';
import { FeedbackOverlayComponent } from './shared/ui/feedback-overlay';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FeedbackOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly prefs = inject(PrefsStore);

  constructor() {
    effect(() => {
      const theme = this.prefs.theme();
      if (theme === 'system') this.document.documentElement.removeAttribute('data-theme');
      else this.document.documentElement.dataset['theme'] = theme;
    });
  }
}
