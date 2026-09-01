import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../shared/ui/app-icon';
import {
  stoaQlCommands,
  stoaQlErrorExample,
  stoaQlGrammar,
  stoaQlRequestExample,
  stoaQlResponseExample,
} from './data/stoaql-docs-content';
import { StoaQlCodeExampleComponent } from './ui/stoaql-code-example';
import { StoaQlCommandReferenceComponent } from './ui/stoaql-command-reference';
import { StoaQlDocsHeaderComponent } from './ui/stoaql-docs-header';
import { StoaQlDocsNavComponent } from './ui/stoaql-docs-nav';

@Component({
  selector: 'app-stoaql-docs-page',
  standalone: true,
  imports: [
    RouterLink,
    AppIconComponent,
    StoaQlCodeExampleComponent,
    StoaQlCommandReferenceComponent,
    StoaQlDocsHeaderComponent,
    StoaQlDocsNavComponent,
  ],
  templateUrl: './stoaql-docs-page.html',
  styleUrl: './stoaql-docs-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoaQlDocsPageComponent {
  readonly commands = stoaQlCommands;
  readonly grammar = stoaQlGrammar;
  readonly requestExample = stoaQlRequestExample;
  readonly responseExample = stoaQlResponseExample;
  readonly errorExample = stoaQlErrorExample;
  readonly quickStart =
    'ADD "SSH" AS ssh; LINK "https://www.openssh.com" AS docs TITLE "OpenSSH"; CONNECT ssh -> docs; LAYOUT MINDMAP FROM ssh';
}
