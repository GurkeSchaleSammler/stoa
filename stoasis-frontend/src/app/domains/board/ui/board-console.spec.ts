import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { StoaQlHistoryItem } from '../data/models/stoaql-query';
import { BoardConsoleComponent } from './board-console';

describe('BoardConsoleComponent', () => {
  const history: StoaQlHistoryItem[] = [
    {
      id: 'history-1',
      queryId: 'qry-1',
      query: 'ADD "SSH"',
      languageVersion: '1.0',
      dryRun: false,
      success: true,
      operationCount: 1,
      resultCount: 0,
      durationMs: 12,
      createdAt: '2026-09-01T10:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardConsoleComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  it('renders the current board and persisted history', () => {
    const fixture = TestBed.createComponent(BoardConsoleComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('boardName', 'Japan-Trip 2027');
    fixture.componentRef.setInput('history', history);
    fixture.componentRef.setInput('historyVisible', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Japan-Trip 2027');
    expect(element.textContent).toContain('ADD "SSH"');
    expect(element.querySelector('.stoaql-console')).not.toBeNull();
  });

  it('uses arrow keys to navigate and enter to execute', () => {
    const fixture = TestBed.createComponent(BoardConsoleComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('boardName', 'Japan-Trip 2027');
    fixture.componentRef.setInput('history', history);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const previous = vi.fn();
    const execute = vi.fn();
    component.historyPrevious.subscribe(previous);
    component.execute.subscribe(execute);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="text"]');

    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(previous).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('renders query errors in the active language', () => {
    const fixture = TestBed.createComponent(BoardConsoleComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('boardName', 'Japan-Trip 2027');
    fixture.componentRef.setInput('error', {
      code: 'STOAQL_UNKNOWN_ALIAS',
      message: {
        de: "Alias 'missing' ist nicht definiert.",
        en: "Alias 'missing' is not defined.",
        fr: "L'alias 'missing' n'est pas défini.",
        it: "L'alias 'missing' non è definito.",
      },
      hint: {
        de: 'Deutscher Hint',
        en: 'English hint',
        fr: 'Indice français',
        it: 'Suggerimento italiano',
      },
      line: 1,
      column: 1,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Alias 'missing' ist nicht definiert.",
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Deutscher Hint');
  });
});
