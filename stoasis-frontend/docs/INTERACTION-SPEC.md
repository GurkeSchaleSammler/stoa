# Stoasis Interaction-SPEC

Status: verbindliche Verhaltensrichtlinie für Mutationen und Dialoge

## Zentrales Feedback

- Jede vom Nutzer ausgelöste Create-, Save-, Update- oder Delete-Operation endet immer mit einer eindeutigen Rückmeldung: Erfolg oder Fehler.
- Globale Rückmeldungen laufen über den signal-basierten `SnackbarService`. Formularnahe Rückmeldungen dürfen zusätzlich als neues optisches Element direkt im Formular erscheinen.
- Ein Fehler darf nie still geschluckt werden. Wenn die API keinen verständlichen Text liefert, wird ein übersetzter domänenspezifischer Fallback angezeigt.
- Snackbars sind übersetzt, per Icon und Text verständlich, schliessbar, über `aria-live` angekündigt und verschwinden nach angemessener Zeit automatisch.
- Mehrere Rückmeldungen dürfen gestapelt werden, ohne wesentliche Aktionen zu verdecken.

## Dialoge und Popup-Lebenszyklus

- Native Browser-Dialoge wie `window.alert`, `window.confirm` oder `prompt` sind verboten. Bestätigungen verwenden ausschliesslich den zentralen app-eigenen Dialogservice.
- Destruktive Aktionen nennen das betroffene Objekt, bieten Abbrechen und Löschen an und verwenden eine eindeutige Gefahren-Darstellung.
- Ein offenes Pin-, Pinnwand- oder Profil-Popup schliesst nach erfolgreichem Save, Update oder Delete automatisch.
- Bei einem Fehler bleibt das Popup geöffnet, damit Eingaben erhalten bleiben und die Operation erneut versucht werden kann.
- Ein Popup darf nicht beim Start einer Anfrage geschlossen werden. Der erfolgreiche API-Callback ist die einzige Stelle, die das Schliessen auslöst.
- Abbrechen schliesst ohne Mutation und ohne Erfolgs-Snackbar.

## Verbindliche Mutationsmatrix

| Objekt            | Aktion        | Erfolg                                             | Fehler                              | Popup                               |
| ----------------- | ------------- | -------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| Pin               | Erstellen     | Erfolgs-Snackbar                                   | Fehler-Snackbar + Eingaben behalten | nach Erfolg schliessen              |
| Pin               | Aktualisieren | Erfolgs-Snackbar                                   | Fehler-Snackbar + Eingaben behalten | nach Erfolg schliessen              |
| Pin               | Löschen       | Bestätigungsdialog + Erfolgs-Snackbar              | Fehler-Snackbar                     | nach Erfolg schliessen              |
| Pinnwand/Sammlung | Erstellen     | Erfolgs-Snackbar + Navigation                      | Fehler-Snackbar + Eingaben behalten | nach Erfolg schliessen/navigieren   |
| Pinnwand/Sammlung | Aktualisieren | Erfolgs-Snackbar                                   | Fehler-Snackbar + Eingaben behalten | nach Erfolg schliessen/navigieren   |
| Pinnwand/Sammlung | Löschen       | Bestätigungsdialog + Erfolgs-Snackbar              | Fehler-Snackbar                     | nach Erfolg schliessen/navigieren   |
| Profil            | Aktualisieren | Erfolgs-Snackbar + Session aktualisieren           | Fehler-Snackbar + Eingaben behalten | nach Erfolg schliessen, falls modal |
| Profilbild        | Hochladen     | Upload-Snackbar + Vorschau                         | Fehler-Snackbar                     | Formular geöffnet lassen            |
| Konto             | Löschen       | Bestätigungsdialog + Erfolgs-Snackbar + Navigation | Fehler-Snackbar                     | erst nach Erfolg verlassen          |

## Signal-Architektur

- Zustände bleiben signal-basiert: private beschreibbare Signals, öffentliche Readonly-Signals oder Computeds.
- Parameter dynamischer Routen werden reaktiv als Signals gelesen. Beim Wechsel einer Pinnwand muss der bestehende Handler den neuen Inhalt laden, Dialogzustände zurücksetzen und veraltete laufende Ladeanfragen abbrechen.
- UI-Komponenten zeigen Zustand und emittieren Ereignisse. Handler koordinieren Formulare, Dialoge und Navigation. Services führen API-Operationen aus und erzeugen Erfolgs- oder Fehlerrückmeldungen.
- Mutationsservices können einen `onSuccess`-Callback annehmen. Er wird ausschliesslich nach aktualisiertem lokalen Zustand und ausgelöster Erfolgsrückmeldung aufgerufen.
