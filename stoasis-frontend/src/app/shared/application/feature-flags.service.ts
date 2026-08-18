import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { API_URL } from '../api/api-url';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly http = inject(HttpClient);
  readonly skillsEnabled = signal(false);

  load(): void {
    this.http
      .get<{ skillsEnabled: boolean }>(`${API_URL}/features`)
      .pipe(catchError(() => of({ skillsEnabled: false })))
      .subscribe((flags) => this.skillsEnabled.set(flags.skillsEnabled));
  }
}
