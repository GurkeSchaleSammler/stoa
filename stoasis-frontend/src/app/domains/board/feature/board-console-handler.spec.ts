import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CollectionService } from '../../collection/data/application/collection.service';
import { StoaQlApi } from '../data/api/stoaql.api';
import { StoaQlHistoryItem } from '../data/models/stoaql-query';
import { BoardConsoleHandlerComponent } from './board-console-handler';

describe('BoardConsoleHandlerComponent', () => {
  const entries: StoaQlHistoryItem[] = [
    {
      id: 'history-2',
      query: 'FIND "Docker"',
      languageVersion: '1.0',
      dryRun: true,
      success: true,
      operationCount: 0,
      resultCount: 1,
      durationMs: 4,
      createdAt: '2026-09-01T10:01:00Z',
    },
    {
      id: 'history-1',
      query: 'ADD "SSH"',
      languageVersion: '1.0',
      dryRun: false,
      success: true,
      operationCount: 1,
      resultCount: 0,
      durationMs: 8,
      createdAt: '2026-09-01T10:00:00Z',
    },
  ];
  const api = {
    history: vi.fn(() => of(entries)),
    clearHistory: vi.fn(() => of(undefined)),
    execute: vi.fn(),
  };

  beforeEach(async () => {
    api.history.mockClear();
    api.clearHistory.mockClear();
    await TestBed.configureTestingModule({
      imports: [BoardConsoleHandlerComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'de', lang: 'de' }),
        { provide: StoaQlApi, useValue: api },
        { provide: CollectionService, useValue: { collections: signal([]) } },
      ],
    }).compileComponents();
  });

  it('loads board history when the console opens', async () => {
    const fixture = TestBed.createComponent(BoardConsoleHandlerComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('collectionId', 'coll-japan');
    fixture.componentRef.setInput('boardName', 'Japan');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.history).toHaveBeenCalledWith('coll-japan');
    expect(fixture.componentInstance.history()).toEqual(entries);
  });

  it('navigates backwards and forwards through history without losing the draft', () => {
    const fixture = TestBed.createComponent(BoardConsoleHandlerComponent);
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('collectionId', 'coll-japan');
    fixture.componentRef.setInput('boardName', 'Japan');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.history.set(entries);
    component.query.set('draft');

    component.navigateHistory('previous');
    expect(component.query()).toBe('FIND "Docker"');
    component.navigateHistory('previous');
    expect(component.query()).toBe('ADD "SSH"');
    component.navigateHistory('next');
    expect(component.query()).toBe('FIND "Docker"');
    component.navigateHistory('next');
    expect(component.query()).toBe('draft');
  });
});
