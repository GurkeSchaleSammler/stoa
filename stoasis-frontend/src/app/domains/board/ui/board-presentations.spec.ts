import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { BoardPresentationsComponent } from './board-presentations';
import { BoardPresentationPlayerComponent } from './board-presentation-player';
import { Pin } from '../../../shared/models/pin';

const pin = (id: string): Pin => ({
  id,
  collectionId: 'board',
  createdBy: 'u',
  createdByName: 'User',
  createdByAvatarUrl: null,
  createdAt: '2026-10-13',
  sortOrder: 0,
  tags: [],
  comments: [],
  type: 'note',
  data: { content: id, color: 'white' },
  grid: { id, x: 0, y: 0, width: 16, heightClips: 12, layer: 1, contentType: 'note' },
});
describe('Presentation paths', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService()] }));
  it('enforces creation capacity while allowing existing path edits, reordering and repeated stations', () => {
    const fixture = TestBed.createComponent(BoardPresentationsComponent);
    const paths = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      name: 'Tour',
      pinIds: ['a', 'b'],
    }));
    fixture.componentRef.setInput('pins', [pin('a'), pin('b')]);
    fixture.componentRef.setInput('paths', paths);
    const component = fixture.componentInstance;
    expect(component.canCreate()).toBe(false);
    component.edit(paths[0]);
    component.add('a');
    component.move(2, -1);
    expect(component.draft()?.pinIds).toEqual(['a', 'a', 'b']);
    component.remove(0);
    expect(component.draft()?.pinIds).toEqual(['a', 'b']);
    fixture.componentRef.setInput('limit', null);
    expect(component.canCreate()).toBe(true);
  });
  it('navigates with arrow keys and skips pins removed after saving', () => {
    const fixture = TestBed.createComponent(BoardPresentationPlayerComponent);
    fixture.componentRef.setInput('pins', [pin('a'), pin('b')]);
    fixture.componentRef.setInput('path', { id: 'p', name: 'Tour', pinIds: ['a', 'deleted', 'b'] });
    const component = fixture.componentInstance;
    expect(component.steps().length).toBe(2);
    component.key(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.active()?.id).toBe('b');
    component.key(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.index()).toBe(1);
    component.key(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(component.active()?.id).toBe('a');
  });
});
