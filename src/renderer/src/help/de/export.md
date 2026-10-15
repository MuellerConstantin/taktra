## Wofür ist der Export?

Um erfasste Zeit weiterzugeben, etwa für eine Rechnung, eine Lohnabrechnung oder ein anderes System. Die Datei hält außerdem einen festen Stand fest, den spätere Änderungen in Taktra nicht mehr berühren.

## Was steht in der Datei?

Standardmäßig eine Zeile pro Eintrag, mit Namen statt interner Nummern. Uhrzeiten stehen in deiner Ortszeit, Dauern in ganzen Minuten oder in Stunden, Notizen so, wie du sie geschrieben hast. Exportiert werden nur abgeschlossene Einträge, ein laufender Timer fehlt also.

## Welches Format soll ich nehmen?

Das, was das einlesende System erwartet. Willst du die Datei selbst in einer Tabellenkalkulation öffnen, nimm XLSX: Datum und Dauer kommen dort als solche an und lassen sich gleich sortieren und summieren. CSV und JSON sind für andere Programme gedacht.

## Wozu gibt es Vorlagen?

Damit die Datei zum System passt, das sie einliest. Eine Vorlage legt fest, welche Spalten in welcher Reihenfolge und unter welchem Namen in der Datei stehen. Neben den Standardspalten können das auch [benutzerdefinierte Felder](customFields.md) sein. Vorlagen werden im Profil gespeichert. Ohne Vorlage enthält die Datei die Standardspalten.

## Kann die Datei Summen statt einzelner Einträge enthalten?

Ja, eine Vorlage kann die Einträge summieren: Jede Kombination ihrer übrigen Spalten wird zu einer Zeile, etwa eine pro Tätigkeit und Tag. Bei Tagen als Spalten bekommt stattdessen jeder Tag des Zeitraums eine eigene Spalte, wie in einem Stundenzettel. Beginn, Ende und Notiz unterscheiden sich bei jedem Eintrag und lassen sich deshalb nicht summieren.
