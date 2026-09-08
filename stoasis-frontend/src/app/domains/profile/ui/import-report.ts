import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ImportResult } from '../data/models/import-result';

/** Displays counts and paginated row outcomes as plain text. */
@Component({
  selector: 'ui-import-report',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './portability.scss',
  template: `
    <div aria-live="polite">
      <p>{{ 'portability.counts' | translate: report() }}</p>
      <div class="report-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ 'portability.row' | translate }}</th>
              <th>{{ 'common.name' | translate }}</th>
              <th>{{ 'portability.outcome' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.row) {
              <tr>
                <td>{{ row.row }}</td>
                <td>
                  <strong>{{ row.title }}</strong
                  ><small>{{ row.url }}</small>
                </td>
                <td>
                  {{ 'portability.status.' + row.status | translate
                  }}<small>{{ row.message }}</small>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (report().rows.length > 25) {
        <nav class="data-actions" [attr.aria-label]="'portability.rows' | translate">
          <button [disabled]="page() === 0" (click)="page.set(page() - 1)">
            {{ 'common.back' | translate }}
          </button>
          <span>{{ page() + 1 }} / {{ pageCount() }}</span>
          <button [disabled]="page() + 1 >= pageCount()" (click)="page.set(page() + 1)">
            {{ 'portability.next' | translate }}
          </button>
        </nav>
      }
    </div>
  `,
})
export class ImportReportComponent {
  readonly report = input.required<ImportResult>();
  readonly page = signal(0);
  readonly pageCount = computed(() => Math.ceil(this.report().rows.length / 25));
  readonly rows = computed(() =>
    this.report().rows.slice(this.page() * 25, (this.page() + 1) * 25),
  );
  constructor() {
    effect(() => {
      this.report();
      this.page.set(0);
    });
  }
}
