export interface StoaQlSuggestion {
  label: string;
  detail: string;
  insertText: string;
  replaceFrom: number;
}

const COMMANDS = [
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
  'USE',
] as const;

export function stoaQlSuggestions(query: string, boardNames: string[] = []): StoaQlSuggestion[] {
  const aliases = [...query.matchAll(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)/gi)].map(
    (match) => match[1],
  );
  const statementStart = query.lastIndexOf(';') + 1;
  const statement = query.slice(statementStart);
  const fragmentMatch = statement.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  const fragment = fragmentMatch?.[0] ?? '';
  const replaceFrom = fragmentMatch
    ? statementStart + (fragmentMatch.index ?? statement.length)
    : query.length;
  const beforeFragment = statement.slice(0, fragmentMatch?.index ?? statement.length);

  const boardFragment = statement.match(/\b(?:USE|TO|IN)\s+"([^"]*)$/i);
  if (boardFragment) {
    const value = boardFragment[1];
    return [...new Set(boardNames)].filter((name) => name.toLowerCase().startsWith(value.toLowerCase())).map(
      (name) => ({
        label: name,
        detail: 'Board',
        insertText: `${name}"`,
        replaceFrom: query.length - value.length,
      }),
    );
  }

  if (/^\s*$/.test(beforeFragment)) {
    return filterSuggestions(
      COMMANDS.map((command) => ({
        label: command,
        detail: commandDetail(command),
        insertText: `${command} `,
        replaceFrom,
      })),
      fragment,
    );
  }

  if (/\bLAYOUT\s*$/i.test(beforeFragment)) {
    return filterSuggestions(
      ['MINDMAP', 'TREE', 'GRID'].map((layout) => ({
        label: layout,
        detail: 'Layout',
        insertText: layout === 'GRID' ? `${layout}` : `${layout} FROM `,
        replaceFrom,
      })),
      fragment,
    );
  }

  if (/^\s*LAYOUT\s+(?:MINDMAP|TREE)\s*$/i.test(beforeFragment)) {
    return filterSuggestions(
      [{ label: 'FROM', detail: 'Start-Pin', insertText: 'FROM ', replaceFrom }],
      fragment,
    );
  }

  if (
    /\b(?:CONNECT|DISCONNECT|GET|DELETE|MOVE)\s*$/i.test(beforeFragment) ||
    /\bUPDATE\s*$/i.test(beforeFragment) ||
    /->\s*$/i.test(beforeFragment) ||
    /\bFROM\s*$/i.test(beforeFragment)
  ) {
    return filterSuggestions(
      [...new Set(aliases)].map((alias) => ({
        label: alias,
        detail: 'Alias',
        insertText: alias,
        replaceFrom,
      })),
      fragment,
    );
  }

  if (/^\s*UPDATE\s+[A-Za-z_][A-Za-z0-9_]*\s*$/i.test(beforeFragment)) {
    return filterSuggestions(
      ['TITLE', 'TEXT', 'TAGS'].map((option) => ({
        label: option,
        detail: 'Feld',
        insertText: option === 'TAGS' ? 'TAGS [""]' : `${option} ""`,
        replaceFrom,
      })),
      fragment,
    );
  }

  if (/^\s*(?:ADD|LINK)\s+"(?:[^"\\]|\\.)*"\s+/i.test(statement)) {
    const options = /^\s*ADD\b/i.test(statement)
      ? ['AS', 'TEXT', 'TAGS', 'TO']
      : ['AS', 'TITLE', 'TAGS', 'TO'];
    const structure = beforeFragment.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const lastUsedIndex = options.reduce(
      (last, option, index) => (new RegExp(`\\b${option}\\b`, 'i').test(structure) ? index : last),
      -1,
    );
    return filterSuggestions(
      options.slice(lastUsedIndex + 1).map((option) => ({
        label: option,
        detail: 'Option',
        insertText: optionInsertText(option),
        replaceFrom,
      })),
      fragment,
    );
  }

  return [];
}

function filterSuggestions(
  suggestions: StoaQlSuggestion[],
  fragment: string,
): StoaQlSuggestion[] {
  const normalized = fragment.toLowerCase();
  return suggestions.filter((suggestion) => suggestion.label.toLowerCase().startsWith(normalized));
}

function optionInsertText(option: string): string {
  if (option === 'AS') return 'AS ';
  if (option === 'TAGS') return 'TAGS [""]';
  if (option === 'TO') return 'TO ""';
  return `${option} ""`;
}

function commandDetail(command: (typeof COMMANDS)[number]): string {
  const details: Record<(typeof COMMANDS)[number], string> = {
    ADD: 'Notiz erstellen',
    LINK: 'Link erstellen',
    CONNECT: 'Pins verbinden',
    DISCONNECT: 'Verbindung entfernen',
    FIND: 'Pins suchen',
    GET: 'Pin oder Board lesen',
    UPDATE: 'Pin aktualisieren',
    DELETE: 'Pin löschen',
    MOVE: 'Pin verschieben',
    LAYOUT: 'Board anordnen',
    USE: 'Board-Kontext wechseln',
  };
  return details[command];
}
