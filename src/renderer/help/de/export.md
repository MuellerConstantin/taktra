## Wofür ist der Export?

Um erfasste Zeit weiterzugeben, etwa für eine Rechnung, eine Lohnabrechnung oder ein anderes System. Die Datei hält außerdem einen festen Stand fest, den spätere Änderungen in Taktra nicht mehr berühren.

## Was steht in der Datei?

Standardmäßig eine Zeile pro Eintrag, mit Namen statt interner Nummern. Uhrzeiten stehen in deiner Ortszeit, Dauern in ganzen Minuten oder in Stunden, Notizen so, wie du sie geschrieben hast. Exportiert werden nur abgeschlossene Einträge, ein laufender Timer fehlt also.

## Welches Format soll ich nehmen?

Das, was das einlesende System erwartet. Willst du die Datei selbst in einer Tabellenkalkulation öffnen, nimm XLSX: Datum und Dauer kommen dort als solche an und lassen sich gleich sortieren und summieren. CSV und JSON sind für andere Programme gedacht.

## Kann ich die Spalten selbst wählen?

Ja, für jeden Export. Du legst fest, welche Spalten in welcher Reihenfolge und unter welchem Namen in der Datei stehen. Neben den Standardspalten können das auch [benutzerdefinierte Felder](customFields.md) sein. Die Auswahl gilt nur für diesen Export, danach beginnt der Export wieder mit den Standardspalten.

## Wozu gibt es Vorlagen?

Damit du eine Auswahl, die du öfter brauchst, nicht jedes Mal neu zusammenstellst, etwa für das System, das die Datei einliest. Eine Vorlage speichert Spalten, Layout und Format im Profil. Was du nach dem Laden einer Vorlage änderst, gilt nur für diesen Export, bis du es in der Vorlage speicherst.

## Kann die Datei Summen statt einzelner Einträge enthalten?

Ja, eine Vorlage kann die Einträge summieren: Jede Kombination ihrer übrigen Spalten wird zu einer Zeile, etwa eine pro Tätigkeit und Tag. Bei Tagen als Spalten bekommt stattdessen jeder Tag des Zeitraums eine eigene Spalte, wie in einem Stundenzettel. Beginn und Ende unterscheiden sich bei jedem Eintrag und lassen sich deshalb nicht summieren.

## Bildet jede Spalte summierter Zeilen eigene Zeilen?

Nur wenn sie Zeilen bildet, das ist der Standard. Eine Spalte kann ihre Werte stattdessen auflisten: Dann bildet sie keine eigenen Zeilen und nennt die verschiedenen Werte der summierten Einträge je einmal, etwa alle Tags eines Projekts. Notizen werden immer aufgelistet, in der Reihenfolge ihrer Einträge. Das Datum bildet nur Zeilen, weil mehrere Daten kein Datum mehr sind.
