# Stoasis UX-SPEC

Status: verbindliche Produkt- und Designrichtlinie

## Marke und visuelle Sprache

- In der Oberfläche werden keine Emojis als Icons oder Dekoration eingesetzt. Symbole stammen aus der zentralen SVG-Icon-Komponente und übernehmen ihre Farbe über `currentColor`.
- Emojis sind nur als nutzergenerierte Daten zulässig, beispielsweise als Emoji einer Sammlung oder als Bestandteil eines Titels.
- Stoasis verwendet die Logo- und Favicon-Assets aus `public/`. Logos erhalten einen sinnvollen Alternativtext oder ein leeres `alt`, wenn direkt daneben bereits ein lesbarer Markenname steht.
- Icons in interaktiven Elementen sind gut erkennbar, in der Regel 18 bis 24 Pixel gross. Im Darkmode sind sie hell, im Lightmode dunkel; kontextuelle Statusfarben sind zulässig, wenn der Kontrast erhalten bleibt.
- Das Abonnement- und Planmodell ist bis zur bewussten Produktfreigabe vollständig aus der sichtbaren Oberfläche entfernt. Es darf keine Navigation, Werbung oder Einstellungszeile dazu geben.
- Farbwelt und Helligkeit sind unabhängige Einstellungen. Die Farbwelten `default`, `yellow`, `dark-green`, `pink`, `purple` und `burgundy` funktionieren jeweils mit Light, Dark und Systemmodus.
- Paletten definieren ausschließlich globale semantische CSS-Tokens in `src/styles/_themes.scss`. Komponenten verwenden nur Tokens wie `--surface-raised`, `--text` oder `--accent` und enthalten keine palettenspezifischen Theme-Klassen.

## Responsive Design

- Jede Ansicht funktioniert ab 320 Pixel Breite sowie mit Touch-, Maus- und Tastaturbedienung.
- Inhalte dürfen weder vom Desktop-Header noch von der mobilen Utility-Navigation verdeckt werden. Navigationsflächen erhalten eigenen Layoutplatz oder der Inhaltsbereich reserviert den benötigten Abstand.
- Dialoge nutzen `min()`-basierte Breiten, mobile Innenabstände und einen intern scrollbaren Inhaltsbereich. Hauptaktionen bleiben erreichbar.
- Mehrspaltige Grids wechseln auf Tablets und Smartphones zu einer Spalte. Aktionsleisten dürfen umbrechen oder werden vertikal angeordnet.
- Interaktive Ziele sind grundsätzlich mindestens 40 × 40 Pixel gross; Fokuszustände sind sichtbar.
- Profilbilder und Mitglieder-Avatare besitzen immer ein quadratisches Seitenverhältnis, kreisförmiges Clipping und `object-fit: cover`, unabhängig vom Seitenverhältnis der hochgeladenen Datei.

## Bewegung und Rückmeldung

- Mikroanimationen sind kurz, diskret und erklären Zustandswechsel. Erfolg und Fehler besitzen unterschiedliche, nicht allein farbbasierte Icons und Animationen.
- Die Startseite enthält eine animierte Produktdemo und ein dezentes Punktfeld, dessen Licht und Versatz auf die Zeigerposition reagieren.
- Raster und Punkthintergründe laufen weich und radial aus. Abstände, Winkel und Deckkraft dürfen leicht variieren; harte lineare Fade-Kanten und technisch perfekte Endlosgitter werden vermieden.
- `prefers-reduced-motion: reduce` deaktiviert dekorative Bewegungen und verkürzt Übergänge praktisch auf null.
- Animationen dürfen niemals das Speichern, Löschen, Navigieren oder Lesen blockieren.

## Externe Link-Vorschauen

- Fremde Webseiten werden niemals als `iframe`, eingebettetes HTML oder clientseitig ausgeführtes Skript dargestellt.
- Linkkarten verwenden ausschliesslich vom Stoasis-Backend erzeugte, statische Rastervorschauen. Das Originalziel wird nur durch eine bewusste Nutzeraktion in einem neuen Browserkontext geöffnet.
- Während des sicheren Serverabrufs erscheint ein Ladezustand; bei blockierten oder nicht erreichbaren Zielen bleibt der Link trotzdem speicherbar und erhält eine verständliche Fehlerrückmeldung.

## Startseite und SEO

- Die Startseite ist scrollbar und besteht mindestens aus Hero, interaktiver Demo, Funktionen/Mehrwerten, erklärtem Ablauf und abschliessender Handlungsaufforderung.
- Pro Seite existiert genau eine primäre `h1`; weitere Abschnitte folgen einer semantischen Überschriftenhierarchie.
- Titel, Description, Robots, Open Graph, Twitter Card, Manifest, Favicons und strukturierte Software-Daten werden in `index.html` bzw. `site.webmanifest` gepflegt.
- Alle sichtbaren und zugänglichen Texte werden über die Übersetzungsschicht in DE, EN, FR und IT bereitgestellt. Der Sprachzustand bleibt signal-basiert.

## Profilbild

- Ein Profilbild wird über einen echten Datei-Upload erfasst; ein URL-Feld ist für Nutzer nicht sichtbar.
- Zulässige Formate sind JPEG, PNG und WebP. Der Upload zeigt Erfolg oder Fehler und liefert eine Vorschau.
- Nach dem Upload muss die Profiländerung gespeichert werden. Erst ein erfolgreicher Save übernimmt das Bild dauerhaft in den Session-Kontext.
