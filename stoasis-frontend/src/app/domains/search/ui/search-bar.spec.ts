import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { SearchBarComponent } from './search-bar';

describe('SearchBarComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SearchBarComponent],
      providers: [provideTranslateService({ lang: 'de' })],
    }),
  );

  it('lets users clear an in-flight search and continue typing in the input', () => {
    const fixture = TestBed.createComponent(SearchBarComponent);
    fixture.componentRef.setInput('query', 'Recherche');
    fixture.componentRef.setInput('isSearching', true);
    const cleared = vi.fn();
    fixture.componentInstance.onClear.subscribe(cleared);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    try {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      button.focus();
      button.click();
      expect(cleared).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input'));
      fixture.componentRef.setInput('query', '');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
    } finally {
      fixture.nativeElement.remove();
      fixture.destroy();
    }
  });
});
