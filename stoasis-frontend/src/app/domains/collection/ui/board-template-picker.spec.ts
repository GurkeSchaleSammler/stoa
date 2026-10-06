import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { BoardTemplatePickerComponent } from './board-template-picker';

describe('BoardTemplatePickerComponent', () => {
  it('offers an accessible blank choice and emits the selected template', async () => {
    await TestBed.configureTestingModule({
      imports: [BoardTemplatePickerComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    const fixture = TestBed.createComponent(BoardTemplatePickerComponent);
    fixture.componentRef.setInput('templates', [
      { id: 'project', motif: 'arrow', sections: [{ title: 'Ideas', color: 'sage' }] },
    ]);
    fixture.componentRef.setInput('selected', 'project');
    const selected = vi.fn();
    fixture.componentInstance.selectedChanged.subscribe(selected);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    buttons[0].click();
    expect(selected).toHaveBeenCalledWith('');
    buttons[1].click();
    expect(selected).toHaveBeenCalledWith('project');
  });
});
