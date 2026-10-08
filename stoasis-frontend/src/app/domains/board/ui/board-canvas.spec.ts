import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { BoardCanvasComponent } from './board-canvas';

describe('BoardCanvasComponent creation flow', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [BoardCanvasComponent],
      providers: [provideTranslateService({ lang: 'de' })],
    }),
  );

  it('keeps pin creation in the toolbar after the first pin and in list view', () => {
    const fixture = TestBed.createComponent(BoardCanvasComponent);
    fixture.componentRef.setInput('pins', []);
    fixture.componentRef.setInput('elements', {
      stacks: [],
      connectors: [],
      zones: [],
      labels: [],
      stickers: [],
    });
    fixture.componentRef.setInput('context', {
      id: 'board',
      name: 'Board',
      emoji: '📌',
      members: [],
      allowedTypes: ['note'],
    });
    fixture.componentRef.setInput('canEdit', true);
    const add = vi.fn();
    fixture.componentInstance.onAddPinClick.subscribe(add);
    fixture.detectChanges();
    const originalButton = fixture.nativeElement.querySelector('.add-pin-button');
    expect(fixture.nativeElement.querySelector('.add-pin-card')).not.toBeNull();

    fixture.componentRef.setInput('pins', [
      {
        id: 'pin',
        collectionId: 'board',
        type: 'note',
        data: { content: 'Notiz', color: 'yellow' },
        grid: { id: 'grid', x: 0, y: 0, width: 16, heightClips: 16, layer: 0, contentType: 'note' },
        createdBy: 'jo',
        createdByName: 'Jo',
        createdByAvatarUrl: null,
        createdAt: '2026-10-08',
        sortOrder: 0,
        tags: [],
        comments: [],
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.add-pin-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.add-pin-button')).toBe(originalButton);

    fixture.componentRef.setInput('viewMode', 'list');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.add-pin-button')).toBe(originalButton);
    originalButton.click();
    expect(add).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('canEdit', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.add-pin-button')).toBeNull();
  });
});
