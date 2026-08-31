# StoaQL Specification v0.3
> Backend soll query endpunkkt haben der das checkt
> autocompletion wird auf client gehandlet

**Status:** Draft  
**API-Version:** `v1`  
**Language-Version:** `1.0`  
**Primärer Endpoint:** `POST /api/v1/query`

---

## 1. Ziel

StoaQL ist eine kleine, bewusst einfache One-Line-Command-Sprache für Stoa.

Die Sprache soll:

- schnell zu schreiben sein
- für Menschen verständlich bleiben
- von Raycast, CLI, Chrome Extension, macOS Companion, MCP und anderen Clients identisch genutzt werden können
- möglichst wenig Boilerplate benötigen
- keine direkte Datenbanklogik enthalten
- keine SQL-ähnliche Komplexität entwickeln
- durch Autocomplete sehr schnell bedienbar sein

Eine StoaQL-Query besteht immer aus **einer Zeile**.

Mehrere Aktionen werden mit `;` getrennt.

Beispiel:

```stoaql
USE "Learning"; ADD "SSH" AS ssh; LINK "https://www.openssh.com" AS docs TITLE "OpenSSH"; CONNECT ssh -> docs
```

---

## 2. Grundprinzipien

### 2.1 One-Liner

Eine Query ist immer ein Oneliner:

```stoaql
ADD "Docker" TO "Inbox"
```

Mehrere Statements:

```stoaql
USE "Learning"; ADD "SSH"; ADD "Docker"; ADD "TLS"
```

Mehrzeilige Programme sind nicht Teil von StoaQL v1.

---

### 2.2 Explizite Typen statt Magic Detection

StoaQL erkennt nicht automatisch anhand des Inhalts, welchen Typ ein String darstellt.

```stoaql
ADD "https://example.com"
```

erzeugt eine normale Notiz.

Nur:

```stoaql
LINK "https://example.com"
```

erzeugt einen Link-Pin.

Dadurch ist die Sprache deterministisch.

---

### 2.3 Fotos sind nicht Teil von StoaQL v1

Nicht unterstützt:

```stoaql
PHOTO "image.png"
```

und auch nicht:

```stoaql
ADD PHOTO "image.png"
```

Fotos werden weiterhin über normale Upload-/REST-Funktionen von Stoa verarbeitet.

Eine spätere StoaQL-Version kann einen eigenen Foto-Command ergänzen.

---

### 2.4 Connections sind optional

Pins werden nicht automatisch verbunden.

```stoaql
ADD "SSH"; ADD "Docker"
```

erzeugt zwei unabhängige Pins.

Eine Verbindung entsteht nur durch:

```stoaql
CONNECT ssh -> docker
```

---

### 2.5 StoaQL ist kein SQL-Passthrough

StoaQL spricht ausschließlich in Stoa-Domain-Begriffen.

Intern:

```text
StoaQL
  ↓
Lexer
  ↓
Parser
  ↓
AST
  ↓
Semantic Validation
  ↓
Authorization
  ↓
Command Plan
  ↓
Domain Services
  ↓
Repositories
  ↓
Database
```

Der Parser kennt keine Tabellen, keine Spalten und kein SQL.

---

## 3. Syntax-Konventionen

### Strings

Strings stehen immer in doppelten Anführungszeichen:

```stoaql
"SSH"
```

Escaping:

```stoaql
"Joel sagte: \"Hello\""
```

---

### Statements

Mehrere Statements werden mit `;` getrennt:

```stoaql
ADD "SSH"; ADD "Docker"; ADD "TLS"
```

Der letzte Semikolon ist optional.

---

### Keywords

Keywords werden in der Dokumentation groß geschrieben.

Clients dürfen die Eingabe case-insensitiv behandeln.

Empfehlung für Canonical Output:

```text
USE
ADD
LINK
AS
TO
TITLE
TEXT
TAGS
CONNECT
DISCONNECT
FIND
IN
CONNECTED
DEPTH
GET
BOARD
UPDATE
DELETE
MOVE
LAYOUT
FROM
MINDMAP
TREE
GRID
```

---

## 4. `USE`

Setzt den Board-Kontext für nachfolgende Statements.

Syntax:

```stoaql
USE "Board Name"
```

Beispiel:

```stoaql
USE "learning-collection"
```

Danach:

```stoaql
USE "learning-collection"; ADD "SSH"; ADD "Docker"
```

entspricht logisch:

```stoaql
ADD "SSH" TO "learning-collection"; ADD "Docker" TO "learning-collection"
```

Ein explizites `TO` überschreibt den aktuellen `USE`-Kontext.

---

## 5. `ADD`

`ADD` erzeugt immer eine normale Notiz.

### Minimal

```stoaql
ADD "SSH"
```

### Direkt in ein Board

```stoaql
ADD "SSH" TO "Learning"
```

### Mit Alias

```stoaql
ADD "SSH" AS ssh
```

### Mit Text

```stoaql
ADD "SSH" TEXT "Secure Shell Protocol"
```

### Mit Tags

```stoaql
ADD "SSH" TAGS ["network","security"]
```

### Komplett

```stoaql
ADD "SSH" AS ssh TEXT "Secure Shell Protocol" TAGS ["network","security"] TO "Learning"
```

Canonical Syntax:

```text
ADD "title"
    [AS alias]
    [TEXT "text"]
    [TAGS ["tag1","tag2"]]
    [TO "board"]
```

---

## 6. `LINK`

`LINK` signalisiert ausdrücklich, dass der nächste String eine URL ist.

### Minimal

```stoaql
LINK "https://www.openssh.com"
```

### Board

```stoaql
LINK "https://www.openssh.com" TO "Learning"
```

### Alias

```stoaql
LINK "https://www.openssh.com" AS openssh
```

### Titel

```stoaql
LINK "https://www.openssh.com" TITLE "OpenSSH"
```

### Tags

```stoaql
LINK "https://www.openssh.com" TAGS ["ssh","docs"]
```

### Komplett

```stoaql
LINK "https://www.openssh.com" AS openssh TITLE "OpenSSH" TAGS ["ssh","docs"] TO "Learning"
```

Canonical Syntax:

```text
LINK "url"
    [AS alias]
    [TITLE "title"]
    [TAGS ["tag1","tag2"]]
    [TO "board"]
```

Der String direkt nach `LINK` muss eine gültige URL sein.

---

## 7. Aliases

Aliases sind query-lokale Namen für neu erzeugte oder referenzierte Objekte.

Beispiel:

```stoaql
ADD "SSH" AS ssh
```

Danach kann im selben Oneliner geschrieben werden:

```stoaql
CONNECT ssh -> pub
```

### Regeln

Erlaubt:

```text
ssh
sshKey
ssh_key
node1
```

Nicht erlaubt:

```text
ssh-key
ssh key
"ssh"
```

Empfohlene Regex:

```regex
[a-zA-Z_][a-zA-Z0-9_]*
```

Aliases gelten nur innerhalb derselben Query.

Der Server mappt sie auf echte IDs:

```json
{
  "aliases": {
    "ssh": "pin-123",
    "pub": "pin-456"
  }
}
```

---

## 8. `CONNECT`

Erzeugt eine gerichtete Verbindung.

Syntax:

```stoaql
CONNECT source -> target
```

Beispiel:

```stoaql
CONNECT ssh -> pub
```

Kompletter Oneliner:

```stoaql
USE "Learning"; ADD "SSH" AS ssh; ADD "Public Key" AS pub; ADD "Private Key" AS priv; CONNECT ssh -> pub; CONNECT ssh -> priv
```

StoaQL v1 unterstützt nur:

```text
->
```

Nicht Teil von v1:

```text
<->
--
=>
```

---

## 9. `DISCONNECT`

Entfernt eine gerichtete Verbindung.

```stoaql
DISCONNECT ssh -> pub
```

---

## 10. Mindmaps

StoaQL v1 verwendet keine verschachtelten Blöcke.

Nicht Teil der Sprache:

```stoaql
ADD "SSH" {
    -> "Keys" {
        -> "Public Key"
    }
}
```

Stattdessen bleibt alles ein Oneliner:

```stoaql
USE "Learning"; ADD "SSH" AS ssh; ADD "Keys" AS keys; ADD "Public Key" AS pub; ADD "Private Key" AS priv; CONNECT ssh -> keys; CONNECT keys -> pub; CONNECT keys -> priv; LAYOUT MINDMAP FROM ssh
```

Vorteile:

- eindeutig
- einfach zu parsen
- leicht zu debuggen
- keine Sondergrammatik
- gut für Raycast, CLI und AI

---

## 11. `FIND`

### Normale Suche

```stoaql
FIND "docker"
```

### In einem Board

```stoaql
FIND "docker" IN "Learning"
```

### Nach Tag

```stoaql
FIND TAG "security"
```

### Verbindungen

```stoaql
FIND CONNECTED TO ssh
```

### Mit Tiefe

```stoaql
FIND CONNECTED TO ssh DEPTH 2
```

StoaQL v1 unterstützt bewusst keine komplexen `WHERE`-Expressions.

Nicht Teil von v1:

```sql
FIND PIN WHERE title CONTAINS "docker" AND tag = "backend"
```

---

## 12. `GET`

### Element per ID oder Alias

```stoaql
GET "pin-123"
```

oder innerhalb derselben Query:

```stoaql
ADD "SSH" AS ssh; GET ssh
```

### Board

```stoaql
GET BOARD "Learning"
```

Mit `USE`:

```stoaql
USE "Learning"; GET BOARD
```

---

## 13. `UPDATE`

### Titel

```stoaql
UPDATE ssh TITLE "OpenSSH"
```

### Text

```stoaql
UPDATE ssh TEXT "Secure Shell Protocol"
```

### Tags

```stoaql
UPDATE ssh TAGS ["ssh","security"]
```

StoaQL verwendet bewusst kein SQL-artiges:

```stoaql
UPDATE ssh SET title = "OpenSSH"
```

sondern:

```stoaql
UPDATE ssh TITLE "OpenSSH"
```

---

## 14. `DELETE`

Löscht ein Element.

```stoaql
DELETE ssh
```

oder:

```stoaql
DELETE "pin-123"
```

Das Löschen kompletter Boards ist nicht Teil von StoaQL v1.

Nicht erlaubt:

```stoaql
DELETE BOARD "Production"
```

---

## 15. `MOVE`

Verschiebt ein Element.

```stoaql
MOVE ssh TO 20,40
```

Canonical Syntax:

```text
MOVE <reference> TO <x>,<y>
```

Keine Klammern erforderlich.

---

## 16. `LAYOUT`

### Mindmap

```stoaql
LAYOUT MINDMAP FROM ssh
```

### Tree

```stoaql
LAYOUT TREE FROM ssh
```

### Grid

```stoaql
LAYOUT GRID
```

Unterstützte Layouts in v1:

```text
MINDMAP
TREE
GRID
```

---

## 17. Automatische Positionierung

Wenn keine Position angegeben wird:

```stoaql
ADD "Docker"
```

entscheidet Stoa automatisch.

Der Server soll:

- freie Fläche suchen
- bestehende Pins nicht überlappen
- einen Mindestabstand einhalten
- Board-Bounds respektieren
- bestehende Strukturen möglichst nicht verschieben

---

## 18. Komplette StoaQL-v1-Syntax

```text
USE "board"

ADD "title"
    [AS alias]
    [TEXT "text"]
    [TAGS ["tag","tag"]]
    [TO "board"]

LINK "url"
    [AS alias]
    [TITLE "title"]
    [TAGS ["tag","tag"]]
    [TO "board"]

CONNECT ref -> ref

DISCONNECT ref -> ref

FIND "text"
    [IN "board"]

FIND TAG "tag"

FIND CONNECTED TO ref
    [DEPTH number]

GET ref

GET BOARD
GET BOARD "board"

UPDATE ref TITLE "title"
UPDATE ref TEXT "text"
UPDATE ref TAGS ["tag","tag"]

DELETE ref

MOVE ref TO x,y

LAYOUT MINDMAP FROM ref
LAYOUT TREE FROM ref
LAYOUT GRID
```

---

## 19. EBNF

```ebnf
query
    = statement { ";" statement } ;

statement
    = use
    | add
    | link
    | connect
    | disconnect
    | find
    | get
    | update
    | delete
    | move
    | layout
    ;

use
    = "USE" string ;

add
    = "ADD" string
      [ "AS" identifier ]
      [ "TEXT" string ]
      [ tags ]
      [ "TO" string ]
    ;

link
    = "LINK" string
      [ "AS" identifier ]
      [ "TITLE" string ]
      [ tags ]
      [ "TO" string ]
    ;

tags
    = "TAGS" "[" string { "," string } "]" ;

connect
    = "CONNECT" reference "->" reference ;

disconnect
    = "DISCONNECT" reference "->" reference ;

find
    = "FIND" string [ "IN" string ]
    | "FIND" "TAG" string
    | "FIND" "CONNECTED" "TO" reference [ "DEPTH" number ]
    ;

get
    = "GET" reference
    | "GET" "BOARD" [ string ]
    ;

update
    = "UPDATE" reference updateField ;

updateField
    = "TITLE" string
    | "TEXT" string
    | tags
    ;

delete
    = "DELETE" reference ;

move
    = "MOVE" reference "TO" number "," number ;

layout
    = "LAYOUT" layoutType [ "FROM" reference ] ;

layoutType
    = "MINDMAP"
    | "TREE"
    | "GRID"
    ;

reference
    = identifier
    | string ;
```

---

## 20. Autocomplete

Autocomplete ist ein Pflichtbestandteil von StoaQL v1.

Ziel:

- weniger Tipparbeit
- weniger Syntaxfehler
- Boardnamen schnell auswählen
- Aliases schnell referenzieren
- nur kontextuell gültige Keywords anzeigen

Autocomplete soll grammar-aware sein.

---

## 21. Keyword-Autocomplete

Bei:

```stoaql
LI|
```

Vorschlag:

```text
LINK
```

Bei:

```stoaql
ADD "SSH" |
```

sind nur diese Keywords sinnvoll:

```text
AS
TEXT
TAGS
TO
```

Nicht sinnvoll:

```text
DELETE
FIND
CONNECT
LAYOUT
```

Der aktuelle Parser-Kontext entscheidet, welche Keywords angeboten werden.

---

## 22. Board-Autocomplete

Board-Autocomplete wird überall angeboten, wo ein Board erwartet wird.

### `USE`

```stoaql
USE "lea|
```

Vorschläge:

```text
learning-collection
learning-networking
learning-projects
```

### `TO`

```stoaql
ADD "SSH" TO "lea|
```

### `IN`

```stoaql
FIND "docker" IN "lea|
```

### Link

```stoaql
LINK "https://example.com" TO "lea|
```

Beim Auswählen eines Boards darf der Client automatisch das abschließende `"` ergänzen.

---

## 23. Alias-Autocomplete

Aliases aus der aktuellen Query sollen automatisch vorgeschlagen werden.

Beispiel:

```stoaql
ADD "SSH" AS ssh; ADD "Key" AS key; CONNECT |
```

Vorschläge:

```text
ssh
key
```

Danach:

```stoaql
CONNECT ssh -> |
```

Vorschläge:

```text
key
```

Der Client sollte keine Aliases aus früheren Queries übernehmen.

---

## 24. Layout-Autocomplete

Bei:

```stoaql
LAYOUT |
```

Vorschläge:

```text
MINDMAP
TREE
GRID
```

Bei:

```stoaql
LAYOUT MINDMAP |
```

Vorschlag:

```text
FROM
```

Nach:

```stoaql
LAYOUT MINDMAP FROM |
```

werden verfügbare Aliases bzw. passende References vorgeschlagen.

---

## 25. Tag-Autocomplete

Optional in v1, empfohlen für v1.x.

Bei:

```stoaql
ADD "SSH" TAGS ["sec|
```

können vorhandene Tags vorgeschlagen werden:

```text
security
security-research
```

---

## 26. Autocomplete-Kontexte

Der Completion-Engine soll mindestens folgende Context Types kennen:

```text
KEYWORD
BOARD
ALIAS
VALUE
```

Später:

```text
TAG
PIN
LAYOUT
```

---

## 27. Completion Endpoint

Für Clients, die dieselbe Completion-Logik wie der Server nutzen wollen:

```http
POST /api/v1/stoaql/complete
```

Request:

```json
{
  "query": "ADD \"SSH\" TO \"lea",
  "cursor": 20
}
```

Response:

```json
{
  "context": "BOARD",
  "suggestions": [
    {
      "type": "BOARD",
      "label": "learning-collection",
      "insertText": "learning-collection\""
    },
    {
      "type": "BOARD",
      "label": "learning-networking",
      "insertText": "learning-networking\""
    }
  ]
}
```

---

## 28. Intelligent `insertText`

Autocomplete soll mehr als nur Text ersetzen.

Beispiel:

Bei Auswahl von:

```text
TO
```

kann eingefügt werden:

```stoaql
TO "|
```

Bei:

```text
TAGS
```

kann eingefügt werden:

```stoaql
TAGS ["|"]
```

Bei:

```text
CONNECT
```

kann eingefügt werden:

```stoaql
CONNECT |
```

Damit fühlt sich StoaQL eher wie eine schnelle Command Palette an.

---

## 29. Board-Cache

Für schnelle Autocompletion sollen Clients Boards nicht bei jedem Tastendruck neu laden.

Empfehlung:

```http
GET /api/v1/boards
```

Response:

```json
[
  {
    "id": "board-123",
    "name": "learning-collection"
  },
  {
    "id": "board-456",
    "name": "Inbox"
  }
]
```

Clients halten diese Liste lokal im Cache.

Keywords bleiben komplett lokal, da sie Teil der Grammar sind.

---

## 30. `/query`

Primärer Endpoint:

```http
POST /api/v1/query
Content-Type: application/json
Authorization: Bearer <token>
```

Minimaler Request:

```json
{
  "query": "ADD \"Docker\" TO \"Inbox\""
}
```

Erweiterter Request:

```json
{
  "query": "USE \"Learning\"; ADD \"SSH\" AS ssh; LINK \"https://www.openssh.com\" AS docs; CONNECT ssh -> docs",
  "languageVersion": "1.0",
  "dryRun": false,
  "atomic": true,
  "return": "operations",
  "idempotencyKey": "fa6102af"
}
```

---

## 31. Response

```json
{
  "success": true,
  "queryId": "qry-b6399",
  "languageVersion": "1.0",
  "operations": [
    {
      "type": "PIN_CREATED",
      "entityId": "pin-123"
    }
  ],
  "aliases": {
    "ssh": "pin-123"
  },
  "warnings": [],
  "durationMs": 12
}
```

---

## 32. Dry Run

Request:

```json
{
  "query": "DELETE \"pin-123\"",
  "dryRun": true
}
```

Der Server:

- parst die Query
- resolved References
- prüft Berechtigungen
- validiert Domain-Regeln
- erstellt den Command Plan
- persistiert nichts

---

## 33. Atomic Execution

Default:

```json
{
  "atomic": true
}
```

Beispiel:

```stoaql
ADD "A" AS a; ADD "B" AS b; CONNECT a -> doesNotExist
```

Wenn die dritte Operation fehlschlägt:

- `A` wird nicht gespeichert
- `B` wird nicht gespeichert
- keine Connection wird gespeichert

Die gesamte Query wird zurückgerollt.

---

## 34. Idempotency

Clients können Requests bei Netzwerkfehlern wiederholen.

Dafür:

```json
{
  "idempotencyKey": "d91fd83"
}
```

Ein identischer Retry darf keine doppelten Pins erzeugen.

---

## 35. Fehlerformat

```json
{
  "success": false,
  "error": {
    "code": "STOAQL_UNKNOWN_ALIAS",
    "message": "Alias 'api' is not defined.",
    "line": 1,
    "column": 43,
    "hint": "Declare it using AS api before referencing it."
  }
}
```

---

## 36. Fehlercodes

### Parser

```text
STOAQL_PARSE_ERROR
STOAQL_UNEXPECTED_TOKEN
STOAQL_UNTERMINATED_STRING
```

### Semantik

```text
STOAQL_UNKNOWN_ALIAS
STOAQL_DUPLICATE_ALIAS
STOAQL_AMBIGUOUS_REFERENCE
STOAQL_BOARD_NOT_SELECTED
STOAQL_INVALID_PROPERTY
```

### Authorization

```text
STOAQL_PERMISSION_DENIED
```

### Domain

```text
STOAQL_CONNECTION_CONFLICT
STOAQL_OUT_OF_BOUNDS
STOAQL_STACK_CONFLICT
```

### Execution

```text
STOAQL_TRANSACTION_FAILED
STOAQL_TIMEOUT
STOAQL_RATE_LIMITED
```

---

## 37. HTTP Status

```text
200 Query erfolgreich
400 Syntax-/Semantikfehler
401 nicht authentifiziert
403 keine Berechtigung
404 explizite Referenz nicht gefunden
409 Konflikt
422 Domain-Regel verletzt
429 Rate Limit
500 interner Fehler
```

---

## 38. Security

StoaQL darf niemals rohe SQL-Statements ausführen.

Beispiel:

```stoaql
ADD "'; DROP TABLE pins; --"
```

ist ausschließlich normaler Text.

Intern immer:

```text
StoaQL
→ AST
→ Domain Command
→ Repository
→ Prepared SQL / ORM
```

Keine String-Konkatenation zu SQL.

---

## 39. Limits

Empfohlene Limits:

```text
maxQueryLength       100 KB
maxStatements        500
maxGraphDepth        10
maxReturnedEntities  1000
maxExecutionTime     5 Sekunden
```

Für interaktive Clients können kleinere Limits gelten.

---

## 40. Authorization

Nicht nur `/query` selbst prüfen.

Jedes Statement muss einzeln autorisiert werden.

Beispiel:

```stoaql
USE "Shared Board"; ADD "Foo"; DELETE "pin-123"
```

Die Berechtigung wird für `ADD` und `DELETE` separat geprüft.

---

## 41. Versionierung

Request:

```json
{
  "languageVersion": "1.0",
  "query": "..."
}
```

SemVer-Prinzip:

```text
1.0.1 = Bugfix
1.1   = additive Syntax
2.0   = Breaking Change
```

---

## 42. Gültige Beispiele

### Notiz

```stoaql
ADD "Research OAuth"
```

### Notiz in Board

```stoaql
ADD "Research OAuth" TO "Inbox"
```

### Link

```stoaql
LINK "https://oauth.net/2/"
```

### Link mit Titel

```stoaql
LINK "https://oauth.net/2/" TITLE "OAuth 2.0"
```

### Mindmap

```stoaql
USE "Learning"; ADD "SSH" AS ssh; ADD "Keys" AS keys; ADD "Config" AS config; CONNECT ssh -> keys; CONNECT ssh -> config; LAYOUT MINDMAP FROM ssh
```

### Link in Mindmap

```stoaql
USE "Learning"; ADD "SSH" AS ssh; LINK "https://www.openssh.com/" AS openssh TITLE "OpenSSH"; CONNECT ssh -> openssh
```

### Suche

```stoaql
FIND "docker" IN "Learning"
```

---

## 43. Nicht Teil von StoaQL v1

Bewusst ausgeschlossen:

```text
PHOTO
nested blocks
{}
IF
ELSE
variables außerhalb Aliases
functions
loops
JOIN
GROUP BY
SELECT
INSERT
arbitrary WHERE expressions
multiline programs
raw SQL
filesystem access
network calls innerhalb der Sprache
```

---

## 44. Parser-Struktur

Empfohlene Backend-Struktur:

```text
stoaql/
├── lexer/
│   ├── Token.kt
│   ├── TokenType.kt
│   └── Lexer.kt
│
├── parser/
│   └── Parser.kt
│
├── ast/
│   ├── Statement.kt
│   ├── AddStatement.kt
│   ├── LinkStatement.kt
│   ├── ConnectStatement.kt
│   └── ...
│
├── semantic/
│   ├── AliasResolver.kt
│   ├── CompletionContextResolver.kt
│   └── SemanticValidator.kt
│
├── execution/
│   ├── CommandPlanner.kt
│   └── QueryExecutor.kt
│
└── api/
    ├── QueryController.kt
    ├── CompletionController.kt
    ├── QueryRequest.kt
    └── QueryResponse.kt
```

---

## 45. MVP Acceptance Criteria

StoaQL v1 ist für den ersten produktiven Einsatz bereit, wenn mindestens diese Query funktioniert:

```stoaql
USE "Learning"; ADD "SSH" AS ssh; ADD "Public Key" AS pub; LINK "https://www.openssh.com" AS docs TITLE "OpenSSH"; CONNECT ssh -> pub; CONNECT ssh -> docs; LAYOUT MINDMAP FROM ssh
```

und:

- korrekt geparst wird
- der AST erzeugt wird
- Aliases aufgelöst werden
- Boards validiert werden
- Berechtigungen geprüft werden
- Notizen erstellt werden
- Links erstellt werden
- Connections erstellt werden
- Layout berechnet wird
- die Query atomar ausgeführt wird
- `dryRun` funktioniert
- Autocomplete für Keywords funktioniert
- Autocomplete für Boards funktioniert
- Autocomplete für Aliases funktioniert
- Parserfehler Zeile und Spalte liefern
- der Parser keinen direkten DB-Zugriff besitzt

---

## 46. Designziel in einem Satz

StoaQL soll sich nicht wie SQL anfühlen, sondern wie eine schnelle Command Palette:

```stoaql
USE "Fast Capture"; ADD "Chrome Extension" AS ext; LINK "https://developer.chrome.com/docs/extensions" AS docs TITLE "Chrome Docs"; CONNECT ext -> docs; LAYOUT MINDMAP FROM ext
```

Einfach genug, dass ein Mensch es sofort versteht, strukturiert genug, dass jeder Client es zuverlässig erzeugen und ausführen kann.
