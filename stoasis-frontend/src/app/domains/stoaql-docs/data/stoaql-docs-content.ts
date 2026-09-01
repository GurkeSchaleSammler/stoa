export type StoaQlCommandKind = 'Kontext' | 'Schreiben' | 'Lesen' | 'Graph' | 'Layout';

export interface StoaQlCommandDoc {
  name: string;
  kind: StoaQlCommandKind;
  summary: string;
  syntax: string;
  examples: string[];
  details: string[];
  note?: string;
}

export const stoaQlCommands: readonly StoaQlCommandDoc[] = [
  {
    name: 'USE',
    kind: 'Kontext',
    summary: 'Wählt ein Board für alle folgenden Statements der Query aus.',
    syntax: 'USE "board"',
    examples: ['USE "Learning"; ADD "SSH"', 'USE "Learning"; GET BOARD'],
    details: [
      'Ein explizites TO überschreibt den gewählten Kontext nur für das jeweilige Statement.',
      'In der Board-Konsole ist das geöffnete Board bereits als Kontext gesetzt.',
    ],
    note: 'In der Board-Konsole brauchst du USE nicht zu schreiben.',
  },
  {
    name: 'ADD',
    kind: 'Schreiben',
    summary: 'Erstellt eine normale Notiz. URLs werden dabei nicht automatisch erkannt.',
    syntax: 'ADD "title" [AS alias] [TEXT "text"] [TAGS ["tag"]] [TO "board"]',
    examples: ['ADD "SSH"', 'ADD "SSH" AS ssh TEXT "Secure Shell" TAGS ["network","security"]'],
    details: [
      'AS bindet den neuen Pin an einen query-lokalen Alias.',
      'Ohne TO wird das aktuelle Board verwendet.',
    ],
  },
  {
    name: 'LINK',
    kind: 'Schreiben',
    summary: 'Erstellt einen Link-Pin aus einer HTTP- oder HTTPS-URL.',
    syntax: 'LINK "url" [AS alias] [TITLE "title"] [TAGS ["tag"]] [TO "board"]',
    examples: [
      'LINK "https://www.openssh.com"',
      'LINK "https://www.openssh.com" AS docs TITLE "OpenSSH" TAGS ["ssh","docs"]',
    ],
    details: [
      'Die URL muss vollständig und gültig sein.',
      'Ohne TITLE wird die URL zunächst auch als Titel verwendet.',
    ],
  },
  {
    name: 'CONNECT',
    kind: 'Graph',
    summary: 'Erstellt eine Verbindung zwischen zwei Pins desselben Boards.',
    syntax: 'CONNECT reference -> reference',
    examples: ['ADD "SSH" AS ssh; ADD "Keys" AS keys; CONNECT ssh -> keys'],
    details: [
      'Der Pfeil legt Quelle und Ziel im Statement fest.',
      'FIND CONNECTED durchläuft bestehende Verbindungen in beide Richtungen.',
    ],
  },
  {
    name: 'DISCONNECT',
    kind: 'Graph',
    summary: 'Entfernt eine bestehende Verbindung zwischen zwei Pins.',
    syntax: 'DISCONNECT reference -> reference',
    examples: ['DISCONNECT ssh -> keys'],
    details: ['Beide Referenzen müssen auf Pins im selben Board zeigen.'],
  },
  {
    name: 'FIND',
    kind: 'Lesen',
    summary: 'Sucht Pins nach Text, Tag oder Verbindung.',
    syntax: 'FIND "text" [IN "board"]\nFIND TAG "tag"\nFIND CONNECTED TO reference [DEPTH number]',
    examples: ['FIND "docker"', 'FIND TAG "security"', 'FIND CONNECTED TO ssh DEPTH 2'],
    details: [
      'DEPTH ist optional, standardmäßig 1 und darf zwischen 1 und 10 liegen.',
      'Komplexe WHERE-Ausdrücke gehören nicht zu StoaQL 1.0.',
    ],
  },
  {
    name: 'GET',
    kind: 'Lesen',
    summary: 'Lädt einen einzelnen Pin oder den Inhalt eines Boards.',
    syntax: 'GET reference\nGET BOARD ["board"]',
    examples: ['GET "pin-123"', 'ADD "SSH" AS ssh; GET ssh', 'GET BOARD'],
    details: [
      'GET BOARD ohne Namen verwendet den aktuellen Board-Kontext.',
      'Eine bestehende Pin-ID wird als String, ein neuer Pin über seinen Alias referenziert.',
    ],
  },
  {
    name: 'UPDATE',
    kind: 'Schreiben',
    summary: 'Ändert Titel, Text oder Tags eines Pins.',
    syntax:
      'UPDATE reference TITLE "title"\nUPDATE reference TEXT "text"\nUPDATE reference TAGS ["tag"]',
    examples: [
      'UPDATE ssh TITLE "OpenSSH"',
      'UPDATE ssh TEXT "Secure Shell Protocol"',
      'UPDATE ssh TAGS ["ssh","security"]',
    ],
    details: [
      'TITLE und TEXT sind nur für passende Pin-Typen verfügbar.',
      'TAGS ersetzt die vorhandene Tag-Menge vollständig.',
    ],
  },
  {
    name: 'DELETE',
    kind: 'Schreiben',
    summary: 'Löscht einen einzelnen Pin.',
    syntax: 'DELETE reference',
    examples: ['DELETE ssh', 'DELETE "pin-123"'],
    details: ['Das Löschen ganzer Boards ist in StoaQL 1.0 nicht erlaubt.'],
  },
  {
    name: 'MOVE',
    kind: 'Layout',
    summary: 'Verschiebt einen Pin auf eine absolute Position im Board-Raster.',
    syntax: 'MOVE reference TO x,y',
    examples: ['MOVE ssh TO 20,40'],
    details: ['Koordinaten sind nicht-negative Ganzzahlen; Klammern sind nicht nötig.'],
  },
  {
    name: 'LAYOUT',
    kind: 'Layout',
    summary: 'Ordnet ein Board als Mindmap, Baum oder Raster an.',
    syntax: 'LAYOUT MINDMAP FROM reference\nLAYOUT TREE FROM reference\nLAYOUT GRID',
    examples: ['LAYOUT MINDMAP FROM ssh', 'LAYOUT TREE FROM ssh', 'LAYOUT GRID'],
    details: [
      'MINDMAP und TREE benötigen einen Wurzel-Pin.',
      'GRID verwendet das aktuelle Board und kommt ohne FROM aus.',
    ],
  },
];

export const stoaQlGrammar = `query
  = statement { ";" statement } ;

statement
  = use | add | link | connect | disconnect
  | find | get | update | delete | move | layout ;

reference
  = identifier | string ;

identifier
  = letterOrUnderscore { letterOrDigitOrUnderscore } ;

tags
  = "TAGS" "[" string { "," string } "]" ;`;

export const stoaQlRequestExample = `POST /api/v1/query
Content-Type: application/json

{
  "query": "ADD \\"SSH\\" AS ssh; GET ssh",
  "languageVersion": "1.0",
  "dryRun": false,
  "atomic": true,
  "return": "operations",
  "idempotencyKey": "capture-ssh-01",
  "context": {
    "collectionId": "board-123"
  }
}`;

export const stoaQlResponseExample = `{
  "success": true,
  "queryId": "qry-a1b2c3d4",
  "languageVersion": "1.0",
  "dryRun": false,
  "operations": [
    { "statementIndex": 0, "type": "PIN_CREATED", "entityId": "pin-123" }
  ],
  "results": [
    { "statementIndex": 1, "type": "PIN", "data": { "id": "pin-123" } }
  ],
  "aliases": { "ssh": "pin-123" },
  "warnings": [],
  "durationMs": 12
}`;

export const stoaQlErrorExample = `{
  "success": false,
  "error": {
    "code": "STOAQL_UNKNOWN_ALIAS",
    "message": "Alias 'ssh' ist nicht definiert.",
    "line": 1,
    "column": 9,
    "statementIndex": 0,
    "hint": "Deklariere ihn vorher mit AS ssh."
  }
}`;
