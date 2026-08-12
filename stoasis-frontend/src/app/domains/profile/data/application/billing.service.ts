import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileApi } from '../api/profile.api';
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = inject(ProfileApi);
  portalUrl(): Observable<{ url: string }> {
    return this.api.billingPortal();
  }
}
