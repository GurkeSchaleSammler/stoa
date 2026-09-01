import { describe, expect, it } from 'vitest';
import { stoaQlSuggestions } from './stoaql-completion';

describe('stoaQlSuggestions', () => {
  it('completes commands at the beginning of a statement', () => {
    expect(stoaQlSuggestions('LI').map((item) => item.label)).toEqual(['LINK']);
    expect(stoaQlSuggestions('ADD "A" AS a; CON').map((item) => item.label)).toEqual(['CONNECT']);
  });

  it('offers aliases at connection positions', () => {
    const suggestions = stoaQlSuggestions('ADD "A" AS first; ADD "B" AS second; CONNECT f');
    expect(suggestions.map((item) => item.label)).toEqual(['first']);
  });

  it('offers only layout types after LAYOUT', () => {
    expect(stoaQlSuggestions('LAYOUT ').map((item) => item.label)).toEqual([
      'MINDMAP',
      'TREE',
      'GRID',
    ]);
    expect(stoaQlSuggestions('LAYOUT MINDMAP F').map((item) => item.label)).toEqual(['FROM']);
  });

  it('respects canonical option order and completes boards', () => {
    expect(stoaQlSuggestions('ADD "A" AS a TAGS ["one"] ').map((item) => item.label)).toEqual([
      'TO',
    ]);
    expect(
      stoaQlSuggestions('ADD "A" TO "Sto', ['Stoasis Dev-Ressourcen']).map((item) => item.label),
    ).toEqual(['Stoasis Dev-Ressourcen']);
  });
});
