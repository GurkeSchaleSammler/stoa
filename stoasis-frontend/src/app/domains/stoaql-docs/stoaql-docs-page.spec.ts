import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StoaQlDocsPageComponent } from './stoaql-docs-page';

describe('StoaQlDocsPageComponent', () => {
  let fixture: ComponentFixture<StoaQlDocsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoaQlDocsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StoaQlDocsPageComponent);
    await fixture.whenStable();
  });

  it('documents the complete StoaQL 1.0 command set', () => {
    const element = fixture.nativeElement as HTMLElement;
    const commandHeadings = Array.from(element.querySelectorAll('.command h3')).map((heading) =>
      heading.textContent?.trim(),
    );

    expect(commandHeadings).toEqual([
      'USE',
      'ADD',
      'LINK',
      'CONNECT',
      'DISCONNECT',
      'FIND',
      'GET',
      'UPDATE',
      'DELETE',
      'MOVE',
      'LAYOUT',
    ]);
  });

  it('explains the implicit board context and API endpoints', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('USE ist dort nicht nötig');
    expect(text).toContain('context.collectionId');
    expect(text).toContain('POST /api/v1/query');
    expect(text).toContain('GET/api/v1/query/history');
    expect(text).toContain('DELETE/api/v1/query/history');
    expect(text).toContain('Auch in einem geteilten Board sieht jede Person nur');
  });
});
