import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PortalPinData } from '../../../shared/models/portal-pin-data';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'ui-portal-pin',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    <div class="portal-band"><ui-app-icon name="door" /> {{ 'pin.portal' | translate }}</div>
    <div class="portal-body">
      <span class="portal-emoji" aria-hidden="true">{{ data().emoji }}</span>
      <span class="portal-copy">
        <strong>{{ data().label }}</strong>
        <small>{{
          data().available ? data().targetName : ('pin.portalUnavailable' | translate)
        }}</small>
      </span>
      <button
        type="button"
        [disabled]="!data().available"
        [attr.aria-label]="'pin.openPortal' | translate: { name: data().label }"
        (pointerdown)="$event.stopPropagation()"
        (click)="navigate($event)"
      >
        <ui-app-icon name="chevron-right" />
      </button>
    </div>
  `,
  styleUrl: './portal-pin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalPinComponent {
  readonly data = input.required<PortalPinData>();
  readonly onNavigate = output<PortalPinData>();
  navigate(event: Event): void {
    event.stopPropagation();
    this.onNavigate.emit(this.data());
  }
}
