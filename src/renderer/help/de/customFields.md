## Wofür sind benutzerdefinierte Felder da?

Für zusätzliche Angaben, die Taktra von sich aus nicht kennt, etwa eine Auftragsnummer, eine Kostenstelle oder eine Ticketnummer. Meist braucht man sie für den [Export](export.md), damit die Datei alles enthält, was die Abrechnung verlangt.

## Projekt, Leistungsempfänger oder Tätigkeit?

Dort, wo der Wert hingehört:

- **Projektfeld**: Gilt für das ganze Projekt, etwa eine Auftragsnummer.
- **Feld für Leistungsempfänger**: Beschreibt, für wen gearbeitet wird, etwa eine Kostenstelle.
- **Tätigkeitsfeld**: Gehört zu einer einzelnen Tätigkeit, etwa eine Ticketnummer.

Jedes Feld gehört zu genau einer dieser Ebenen. Jeder Eintrag bekommt den Wert von seiner Tätigkeit, ihrem Projekt oder ihrem Leistungsempfänger.

## Text oder Auswahlliste?

Text für freie Angaben wie Ticketnummern. Eine Auswahlliste, wenn es feste Werte gibt, die immer gleich geschrieben sein sollen. Den Typ kannst du später nicht mehr ändern.

## Warum taucht mein Feld nicht im Export auf?

Felder stehen nur in der Datei, wenn eine [Vorlage](export.md) sie als Spalte enthält. Die Standardspalten ohne Vorlage enthalten keine Felder.

## Was passiert mit Tätigkeitsfeldern beim Verschieben?

Sie bleiben erhalten, denn sie gehören zur Tätigkeit. Projektfelder dagegen kommen danach vom neuen Projekt.

## Warum kann ich ein Feld nicht löschen?

Weil schon Werte eingetragen sind. Archiviere es stattdessen. Dann taucht es beim Bearbeiten nicht mehr auf, die Werte bleiben aber erhalten. Löschen geht nur, solange das Feld leer ist.
