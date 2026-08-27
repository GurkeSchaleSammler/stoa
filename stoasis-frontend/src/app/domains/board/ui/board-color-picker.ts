import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  BOARD_COLOR_PRESETS,
  boardColorCssValue,
  boardColorNativeValue,
  normalizeBoardColor,
} from '../data/models/board-color';

@Component({
  selector: 'ui-board-color-picker',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="board-color-picker" [class.compact]="compact()">
      <span class="board-color-picker-label">{{ labelKey() | translate }}</span>
      <div class="board-color-picker-row">
        @for (color of presets; track color) {
          <button
            type="button"
            class="board-color-swatch"
            [class.active]="normalizedValue() === color"
            [style.--swatch-color]="cssColor(color)"
            [attr.aria-label]="'board.color.' + color | translate"
            (click)="setPreset(color)"
          ></button>
        }
        <label class="native-color" [attr.aria-label]="'pin.customColorPicker' | translate">
          <input
            type="color"
            [value]="nativeColor()"
            [attr.aria-label]="'pin.customColorPicker' | translate"
            (input)="setCustomFromInput($event)"
          />
        </label>
        <input
          class="color-code-input"
          maxlength="7"
          inputmode="text"
          [placeholder]="'pin.customColorCode' | translate"
          [ngModel]="customInputValue()"
          (ngModelChange)="setCustomText($event)"
          (blur)="commitCustom()"
          (keydown.enter)="commitCustom($event)"
        />
        @if (allowClear()) {
          <button type="button" class="color-clear" (click)="clearColor()">
            {{ 'common.reset' | translate }}
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './board-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColorPickerComponent {
  readonly value = input<string | null>(null);
  readonly labelKey = input('pin.pinColor');
  readonly compact = input(false);
  readonly allowClear = input(false);
  readonly valueChange = output<string>();
  readonly clear = output<void>();
  readonly presets = BOARD_COLOR_PRESETS;
  private readonly customDraft = signal('');

  normalizedValue(): string | null {
    return normalizeBoardColor(this.value());
  }

  cssColor(color: string): string {
    return boardColorCssValue(color);
  }

  nativeColor(): string {
    return boardColorNativeValue(this.value());
  }

  customInputValue(): string {
    return this.customDraft() || this.hexValue();
  }

  setPreset(color: string): void {
    this.customDraft.set('');
    this.valueChange.emit(color);
  }

  setCustomFromInput(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.customDraft.set(color);
    this.valueChange.emit(color);
  }

  setCustomText(value: string): void {
    this.customDraft.set(value);
    const normalized = normalizeBoardColor(value);
    if (normalized?.startsWith('#')) {
      this.customDraft.set(normalized);
      this.valueChange.emit(normalized);
    }
  }

  commitCustom(event?: Event): void {
    event?.preventDefault();
    const normalized = normalizeBoardColor(this.customDraft());
    if (!normalized?.startsWith('#')) return;
    this.customDraft.set(normalized);
    this.valueChange.emit(normalized);
  }

  clearColor(): void {
    this.customDraft.set('');
    this.clear.emit();
  }

  private hexValue(): string {
    const normalized = normalizeBoardColor(this.value());
    return normalized?.startsWith('#') ? normalized : '';
  }
}
