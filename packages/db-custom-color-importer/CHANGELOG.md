# Changelog

## [Unreleased]

### Fixed

- **Farbgenauigkeit**: Hex-Werte werden jetzt präzise importiert
  - Problem: `#001110` wurde zu `#00120F` durch Rundung der RGB-Werte
  - Lösung: RGB-Werte verwenden volle Präzision, Alpha-Kanal wird auf ganze Prozent gerundet
  - RGB-Werte: Keine Rundung (volle Präzision für exakte Farben)
  - Alpha-Werte: Rundung auf ganze Prozent (0.00, 0.01, 0.02, ... 1.00)
  - Tests hinzugefügt mit echten Werten aus RITheme JSON

### Added

- **Flexible Prefix Selection**: Der Prefix-Dialog zeigt jetzt alle erkannten Prefixes als auswählbare Optionen an
  - Prefix aus Variablennamen (z.B. "db" aus "db-poi-color-01")
  - Prefix aus Dateinamen (z.B. "RI" aus "DB-RI-Theme-figma.json")
  - Unterstützt beliebig viele erkannte Prefixes (2, 3 oder mehr)
  - Freie Eingabe möglich, wenn kein Prefix erkannt wurde oder ein anderer gewünscht ist

- **Automatische Variablengruppierung**: Variablen mit gemeinsamen Prefixes werden automatisch in verschachtelte Gruppen organisiert
  - Beispiel: `db-poi-db-services` → `db-poi/db-services`
  - Beispiel: `db-poi-services` → `db-poi/services`
  - Macht die Navigation in Figma übersichtlicher

- **Smart Variable Reuse**: Existierende Variablen werden automatisch erkannt und wiederverwendet
  - Prüfung erfolgt basierend auf dem Variablennamen (nicht dem Collection-Prefix)
  - Variablen in der Mode-Collection werden aktualisiert statt neu erstellt
  - Reduziert Duplikate und erhält bestehende Referenzen

- **Prefix-Trennung**: Collection-Prefix und Variablen-Prefix sind jetzt getrennt
  - Collections verwenden den gewählten Prefix (z.B. "RI-Theme", "RI-Mode", "RI-Colors")
  - Variablen behalten ihre originalen Namen (z.B. "db-poi-color-01")
  - Gruppierung erfolgt basierend auf den Variablennamen selbst

- **Processing Screen**: Während des Imports wird ein animierter Loading-Screen angezeigt
  - Visuelles Feedback während der Verarbeitung
  - Verhindert versehentliche Mehrfach-Imports
  - Zeigt klare Status-Nachricht

### Changed

- Prefix-Dialog wird jetzt immer angezeigt, auch beim Import in bestehende Collections
- Verbesserte Benutzerführung mit klarer Erklärung der Gruppierungsfunktion
- Prefix-Auswahl erfolgt über Buttons statt nur Texteingabe (wenn Prefixes erkannt wurden)
- Warnung bei unterschiedlichen Prefixes ist jetzt informativer mit "Change Prefix" Option

### Technical Details

- Neue Funktion `createVariableGroupPath()` für intelligente Gruppierung ohne Prefix-Änderung
- Flexible Array-basierte Prefix-Erkennung statt fixer Struktur
- UI zeigt alle erkannten Prefixes mit ihrer Quelle an
- Display Mode Variables werden jetzt aktualisiert statt immer neu erstellt
- Logging zeigt an, ob Variablen neu erstellt oder aktualisiert wurden
- Processing State verhindert UI-Interaktionen während des Imports
