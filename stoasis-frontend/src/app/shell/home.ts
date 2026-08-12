import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../shared/ui/app-icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  template: `<main
    class="home"
    (pointermove)="trackPointer($event)"
    [style.--pointer-x]="pointerX() + '%'"
    [style.--pointer-y]="pointerY() + '%'"
    [style.--dot-x]="dotX() + 'px'"
    [style.--dot-y]="dotY() + 'px'"
  >
    <section class="hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <div class="home-mark"><img src="/android-chrome-192x192.png" alt="" /></div>
        <p class="eyebrow">{{ 'home.eyebrow' | translate }}</p>
        <h1 id="home-title">
          {{ 'home.title' | translate }}<br /><em>{{ 'home.titleAccent' | translate }}</em>
        </h1>
        <p class="lead">{{ 'home.lead' | translate }}</p>
        <div class="home-actions">
          <a routerLink="/collections/new"
            >{{ 'collection.new' | translate }} <ui-app-icon name="chevron-right"
          /></a>
          <a class="secondary" routerLink="/search"
            ><ui-app-icon name="search" /> {{ 'home.searchPins' | translate }}</a
          >
        </div>
        <div class="principles" [attr.aria-label]="'home.principlesLabel' | translate">
          <span
            ><strong>{{ 'home.privateTitle' | translate }}</strong
            >{{ 'home.privateText' | translate }}</span
          ><span
            ><strong>{{ 'home.sharedTitle' | translate }}</strong
            >{{ 'home.sharedText' | translate }}</span
          ><span
            ><strong>{{ 'home.calmTitle' | translate }}</strong
            >{{ 'home.calmText' | translate }}</span
          >
        </div>
      </div>

      <div class="demo-shell" [attr.aria-label]="'home.demoLabel' | translate">
        <div class="demo-toolbar">
          <span class="demo-brand"><img src="/android-chrome-192x192.png" alt="" /></span>
          <strong>{{ 'home.demoBoard' | translate }}</strong>
          <span class="demo-view"><ui-app-icon name="grid" /></span>
        </div>
        <div class="demo-board">
          <article class="demo-pin demo-link">
            <span class="pin-icon"><ui-app-icon name="link" /></span>
            <small>{{ 'pin.link' | translate }}</small>
            <strong>{{ 'home.demoLinkTitle' | translate }}</strong>
            <span class="demo-lines"></span>
          </article>
          <article class="demo-pin demo-note">
            <span class="pin-icon"><ui-app-icon name="note" /></span>
            <small>{{ 'pin.note' | translate }}</small>
            <strong>{{ 'home.demoNoteTitle' | translate }}</strong>
            <span class="demo-tag">{{ 'home.demoTag' | translate }}</span>
          </article>
          <article class="demo-pin demo-photo">
            <div class="photo-shape"><ui-app-icon name="image" /></div>
            <small>{{ 'pin.photo' | translate }}</small>
            <strong>{{ 'home.demoPhotoTitle' | translate }}</strong>
          </article>
          <span class="demo-cursor"><ui-app-icon name="plus" /></span>
        </div>
      </div>
    </section>

    <section class="content-section benefits" aria-labelledby="benefits-title">
      <header class="section-heading">
        <p class="eyebrow">{{ 'home.featureEyebrow' | translate }}</p>
        <h2 id="benefits-title">{{ 'home.featureTitle' | translate }}</h2>
        <p>{{ 'home.featureLead' | translate }}</p>
      </header>
      <div class="feature-grid">
        <article>
          <span><ui-app-icon name="plus" /></span>
          <h3>{{ 'home.captureTitle' | translate }}</h3>
          <p>{{ 'home.captureText' | translate }}</p>
        </article>
        <article>
          <span><ui-app-icon name="grid" /></span>
          <h3>{{ 'home.organizeTitle' | translate }}</h3>
          <p>{{ 'home.organizeText' | translate }}</p>
        </article>
        <article>
          <span><ui-app-icon name="user-plus" /></span>
          <h3>{{ 'home.shareTitle' | translate }}</h3>
          <p>{{ 'home.shareText' | translate }}</p>
        </article>
      </div>
    </section>

    <section class="content-section workflow" aria-labelledby="workflow-title">
      <div class="workflow-visual" aria-hidden="true">
        <span><ui-app-icon name="link" /></span>
        <i></i>
        <span><ui-app-icon name="note" /></span>
        <i></i>
        <span><ui-app-icon name="image" /></span>
      </div>
      <div class="workflow-copy">
        <p class="eyebrow">{{ 'home.flowEyebrow' | translate }}</p>
        <h2 id="workflow-title">{{ 'home.flowTitle' | translate }}</h2>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>{{ 'home.flowOneTitle' | translate }}</h3>
              <p>{{ 'home.flowOneText' | translate }}</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>{{ 'home.flowTwoTitle' | translate }}</h3>
              <p>{{ 'home.flowTwoText' | translate }}</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>{{ 'home.flowThreeTitle' | translate }}</h3>
              <p>{{ 'home.flowThreeText' | translate }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="closing-cta" aria-labelledby="closing-title">
      <img src="/android-chrome-192x192.png" alt="" />
      <p class="eyebrow">{{ 'home.bottomEyebrow' | translate }}</p>
      <h2 id="closing-title">{{ 'home.bottomTitle' | translate }}</h2>
      <p>{{ 'home.bottomLead' | translate }}</p>
      <a routerLink="/collections/new"
        >{{ 'home.bottomCta' | translate }} <ui-app-icon name="chevron-right"
      /></a>
    </section>
  </main>`,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
    }
    .home {
      position: relative;
      min-height: 100%;
      overflow: hidden;
      background:
        radial-gradient(
          circle at var(--pointer-x, 50%) var(--pointer-y, 24%),
          var(--accent-soft),
          transparent 24rem
        ),
        var(--surface-sunken);
    }
    .home::before {
      position: absolute;
      z-index: 0;
      inset: -24px;
      background-image: radial-gradient(circle, var(--dot) 1px, transparent 1.2px);
      background-size: 26px 26px;
      mask-image: linear-gradient(to bottom, #000 0, transparent 43rem);
      transform: translate(var(--dot-x, 0), var(--dot-y, 0));
      transition: transform 180ms ease-out;
      content: '';
      pointer-events: none;
    }
    .hero,
    .content-section,
    .closing-cta {
      position: relative;
      z-index: 1;
    }
    .hero {
      width: min(1180px, calc(100% - 48px));
      min-height: min(760px, calc(100dvh - 56px));
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(340px, 0.88fr);
      align-items: center;
      gap: clamp(36px, 7vw, 96px);
      padding: 76px 0;
    }
    .hero-copy {
      min-width: 0;
    }
    .home-mark {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      margin-bottom: 22px;
      border: 1px solid var(--border-strong);
      border-radius: 16px;
      background: #121411;
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    .home-mark img,
    .demo-brand img {
      width: 78%;
      height: 78%;
      object-fit: contain;
    }
    .eyebrow {
      margin: 0;
      color: var(--accent-strong);
      font-size: 0.69rem;
      font-weight: 800;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }
    .hero h1 {
      max-width: 720px;
      margin: 14px 0 20px;
      font-family: var(--font-display);
      font-size: clamp(2.7rem, 5.8vw, 5.6rem);
      font-weight: 650;
      line-height: 0.98;
      letter-spacing: -0.055em;
    }
    .hero h1 em {
      color: var(--muted);
      font-weight: 400;
    }
    .lead,
    .section-heading > p:last-child,
    .closing-cta > p:not(.eyebrow) {
      max-width: 580px;
      margin: 0;
      color: var(--muted);
      font-size: clamp(0.92rem, 2vw, 1.07rem);
      line-height: 1.75;
    }
    .home-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 30px;
    }
    .home-actions a,
    .closing-cta a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 46px;
      padding: 0 18px;
      border: 1px solid var(--text);
      border-radius: 11px;
      background: var(--text);
      color: var(--surface-raised);
      font-size: 0.8rem;
      font-weight: 750;
      text-decoration: none;
      transition:
        transform 160ms ease,
        box-shadow 160ms ease;
    }
    .home-actions a:hover,
    .closing-cta a:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .home-actions a.secondary {
      border-color: var(--border);
      background: var(--surface-raised);
      color: var(--text);
    }
    .home-actions ui-app-icon,
    .closing-cta ui-app-icon {
      width: 18px;
      height: 18px;
    }
    .principles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      margin-top: 52px;
    }
    .principles span {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 15px 0;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.7rem;
    }
    .principles strong {
      color: var(--text);
      font-family: var(--font-display);
      font-size: 0.96rem;
    }
    .demo-shell {
      border: 1px solid var(--border);
      border-radius: 22px;
      background: color-mix(in srgb, var(--surface-raised) 94%, transparent);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      transform: rotate(1.5deg);
    }
    .demo-toolbar {
      display: flex;
      align-items: center;
      gap: 11px;
      min-height: 61px;
      padding: 0 17px;
      border-bottom: 1px solid var(--border);
      font-family: var(--font-display);
    }
    .demo-brand,
    .demo-view {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 9px;
    }
    .demo-brand {
      background: #121411;
      overflow: hidden;
    }
    .demo-view {
      margin-left: auto;
      background: var(--surface-sunken);
      color: var(--text);
    }
    .demo-board {
      position: relative;
      min-height: 470px;
      padding: 38px 28px;
      background-image: radial-gradient(circle, var(--dot) 1px, transparent 1px);
      background-size: 21px 21px;
    }
    .demo-pin {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 185px;
      min-height: 160px;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 15px;
      background: var(--surface-raised);
      box-shadow: var(--shadow-md);
      animation: pin-float 5s ease-in-out infinite;
    }
    .demo-pin small {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .demo-pin strong {
      font-family: var(--font-display);
      font-size: 1.05rem;
      line-height: 1.25;
    }
    .pin-icon {
      display: grid;
      place-items: center;
      width: 35px;
      height: 35px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--accent-strong);
    }
    .pin-icon ui-app-icon {
      width: 20px;
      height: 20px;
    }
    .demo-link {
      top: 42px;
      left: 28px;
    }
    .demo-note {
      z-index: 2;
      top: 135px;
      right: 24px;
      background: var(--amber-soft);
      animation-delay: -1.6s;
    }
    .demo-photo {
      bottom: 30px;
      left: 54px;
      animation-delay: -3s;
    }
    .photo-shape {
      display: grid;
      place-items: center;
      height: 78px;
      border-radius: 9px;
      background: linear-gradient(145deg, var(--sage-soft), var(--accent-soft));
      color: var(--sage);
    }
    .photo-shape ui-app-icon {
      width: 30px;
      height: 30px;
    }
    .demo-lines {
      width: 88%;
      height: 24px;
      background: linear-gradient(var(--border-strong) 2px, transparent 2px) 0 0 / 100% 9px;
      opacity: 0.55;
    }
    .demo-tag {
      align-self: flex-start;
      padding: 5px 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--surface-raised) 66%, transparent);
      color: var(--amber);
      font-size: 0.62rem;
    }
    .demo-cursor {
      position: absolute;
      right: 38px;
      bottom: 35px;
      display: grid;
      place-items: center;
      width: 43px;
      height: 43px;
      border-radius: 50%;
      background: var(--text);
      color: var(--surface-raised);
      box-shadow: var(--shadow-md);
      animation: cursor-pulse 2.4s ease-in-out infinite;
    }
    .demo-cursor ui-app-icon {
      width: 21px;
      height: 21px;
    }
    .content-section {
      width: min(1080px, calc(100% - 48px));
      margin: 0 auto;
      padding: clamp(74px, 10vw, 126px) 0;
    }
    .section-heading {
      max-width: 680px;
      margin-bottom: 42px;
    }
    .section-heading h2,
    .workflow h2,
    .closing-cta h2 {
      margin: 10px 0 14px;
      font-family: var(--font-display);
      font-size: clamp(2rem, 4.4vw, 3.7rem);
      line-height: 1.05;
      letter-spacing: -0.045em;
    }
    .benefits {
      border-top: 1px solid var(--border);
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 13px;
    }
    .feature-grid article {
      min-height: 250px;
      padding: 27px;
      border: 1px solid var(--border);
      border-radius: 17px;
      background: var(--surface-raised);
      transition:
        transform 180ms ease,
        border-color 180ms ease;
    }
    .feature-grid article:hover {
      transform: translateY(-5px);
      border-color: var(--border-strong);
    }
    .feature-grid article > span {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: 50px;
      border-radius: 12px;
      background: var(--accent-soft);
      color: var(--accent-strong);
    }
    .feature-grid article:nth-child(2) > span {
      background: var(--amber-soft);
      color: var(--amber);
    }
    .feature-grid article:nth-child(3) > span {
      background: var(--sage-soft);
      color: var(--sage);
    }
    .feature-grid ui-app-icon {
      width: 23px;
      height: 23px;
    }
    .feature-grid h3,
    .workflow h3 {
      margin: 0 0 8px;
      font-family: var(--font-display);
      font-size: 1.23rem;
    }
    .feature-grid p,
    .workflow li p {
      margin: 0;
      color: var(--muted);
      font-size: 0.79rem;
      line-height: 1.65;
    }
    .workflow {
      display: grid;
      grid-template-columns: 0.85fr 1fr;
      align-items: center;
      gap: clamp(48px, 9vw, 120px);
    }
    .workflow-visual {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-height: 460px;
      justify-content: center;
      border: 1px solid var(--border);
      border-radius: 24px;
      background: var(--surface-raised);
      overflow: hidden;
    }
    .workflow-visual::before {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, var(--accent-soft), transparent 52%);
      content: '';
    }
    .workflow-visual span {
      z-index: 1;
      display: grid;
      place-items: center;
      width: 68px;
      height: 68px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--surface-raised);
      color: var(--text);
      box-shadow: var(--shadow-md);
      animation: pin-float 4.8s ease-in-out infinite;
    }
    .workflow-visual span:nth-of-type(2) {
      animation-delay: -1.5s;
    }
    .workflow-visual span:nth-of-type(3) {
      animation-delay: -3s;
    }
    .workflow-visual ui-app-icon {
      width: 28px;
      height: 28px;
    }
    .workflow-visual i {
      z-index: 1;
      width: 1px;
      height: 36px;
      background: var(--border-strong);
    }
    .workflow ol {
      display: grid;
      gap: 0;
      margin: 28px 0 0;
      padding: 0;
      list-style: none;
    }
    .workflow li {
      display: grid;
      grid-template-columns: 43px 1fr;
      gap: 15px;
      padding: 19px 0;
      border-top: 1px solid var(--border);
    }
    .workflow li > span {
      color: var(--accent-strong);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .closing-cta {
      width: min(1080px, calc(100% - 48px));
      margin: 0 auto 50px;
      padding: clamp(58px, 9vw, 104px) 24px;
      border: 1px solid var(--border);
      border-radius: 24px;
      background: var(--surface-raised);
      text-align: center;
    }
    .closing-cta > img {
      width: 58px;
      height: 58px;
      padding: 6px;
      margin-bottom: 20px;
      border-radius: 15px;
      background: #121411;
      object-fit: contain;
    }
    .closing-cta > p:not(.eyebrow) {
      margin: 0 auto;
    }
    .closing-cta a {
      margin-top: 27px;
    }
    @keyframes pin-float {
      0%,
      100% {
        transform: translateY(0) rotate(-0.5deg);
      }
      50% {
        transform: translateY(-8px) rotate(0.7deg);
      }
    }
    @keyframes cursor-pulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.09);
      }
    }
    @media (max-width: 980px) {
      .hero {
        grid-template-columns: 1fr;
        padding-top: 60px;
      }
      .hero-copy {
        text-align: center;
      }
      .home-mark {
        margin-inline: auto;
      }
      .lead {
        margin-inline: auto;
      }
      .home-actions {
        justify-content: center;
      }
      .demo-shell {
        width: min(590px, 100%);
        margin: 0 auto;
        transform: none;
      }
      .demo-board {
        min-height: 430px;
      }
    }
    @media (max-width: 720px) {
      .hero,
      .content-section,
      .closing-cta {
        width: min(100% - 28px, 1080px);
      }
      .hero {
        padding: 52px 0 76px;
      }
      .principles,
      .feature-grid,
      .workflow {
        grid-template-columns: 1fr;
      }
      .principles {
        margin-top: 38px;
      }
      .feature-grid article {
        min-height: 0;
      }
      .feature-grid article > span {
        margin-bottom: 28px;
      }
      .workflow-visual {
        min-height: 380px;
      }
      .closing-cta {
        margin-bottom: 72px;
      }
    }
    @media (max-width: 480px) {
      .home-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .home-actions a {
        width: 100%;
      }
      .demo-board {
        min-height: 420px;
        padding: 24px 16px;
      }
      .demo-pin {
        width: 165px;
        padding: 15px;
      }
      .demo-link {
        left: 15px;
      }
      .demo-note {
        right: 12px;
      }
      .demo-photo {
        left: 24px;
      }
      .content-section {
        padding: 74px 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .home::before,
      .demo-pin,
      .demo-cursor,
      .workflow-visual span {
        transition: none;
        animation: none;
      }
      .home-actions a:hover,
      .closing-cta a:hover,
      .feature-grid article:hover {
        transform: none;
      }
    }
  `,
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
