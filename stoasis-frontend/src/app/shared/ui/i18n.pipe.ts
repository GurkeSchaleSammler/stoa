import { Pipe, PipeTransform } from '@angular/core';
import { defaultAppLanguage } from '../language.constants';
import { StringI18n } from '../models/string-i18n';

@Pipe({
  name: 'i18n',
  standalone: true,
})
export class I18nPipe implements PipeTransform {
  transform(stringI18n: StringI18n | null | undefined, languageKey: string): string {
    if (stringI18n === null || stringI18n === undefined) return '';
    return stringI18n[languageKey as keyof StringI18n] || stringI18n[defaultAppLanguage];
  }
}
