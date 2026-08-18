import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, EMPTY } from 'rxjs';
import { GroupApi } from './data/group.api';

@Component({
  selector: 'app-group-join-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="join-group-page">
      <section>
        @if (failed()) {
          <h1>{{ 'groups.invalidInvite' | translate }}</h1>
          <a routerLink="/groups">{{ 'groups.back' | translate }}</a>
        } @else {
          <h1>{{ 'groups.joining' | translate }}</h1>
          <p>{{ 'groups.joinPrivacy' | translate }}</p>
        }
      </section>
    </main>
  `,
  styleUrl: './groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupJoinPageComponent implements OnInit {
  private readonly api = inject(GroupApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly failed = signal(false);

  ngOnInit(): void {
    this.api
      .join(this.route.snapshot.paramMap.get('token')!)
      .pipe(
        catchError(() => {
          this.failed.set(true);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ groupId }) => void this.router.navigate(['/groups', groupId]));
  }
}
