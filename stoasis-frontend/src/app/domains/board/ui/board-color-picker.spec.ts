import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NOTE_BACKGROUND_PRESETS } from '../data/models/board-color';
import { BoardColorPickerComponent } from './board-color-picker';

describe('BoardColorPickerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardColorPickerComponent],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  it('offers only black and white for a standard note background', () => {
    const fixture = TestBed.createComponent(BoardColorPickerComponent);
    fixture.componentRef.setInput('presetColors', NOTE_BACKGROUND_PRESETS);
    fixture.componentRef.setInput('allowCustom', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const swatches = element.querySelectorAll<HTMLButtonElement>('.board-color-swatch');
    expect(swatches).toHaveLength(2);
    expect(swatches[0].getAttribute('aria-label')).toBe('board.color.black');
    expect(swatches[1].getAttribute('aria-label')).toBe('board.color.white');
    expect(element.querySelector('.native-color')).toBeNull();
    expect(element.querySelector('.color-code-input')).toBeNull();
  });

  it('adds the custom color controls for Pro', () => {
    const fixture = TestBed.createComponent(BoardColorPickerComponent);
    fixture.componentRef.setInput('presetColors', NOTE_BACKGROUND_PRESETS);
    fixture.componentRef.setInput('allowCustom', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.native-color')).not.toBeNull();
    expect(element.querySelector('.color-code-input')).not.toBeNull();
  });
});
