# Vector Position Display

## Übersicht

Das Plugin zeigt jetzt die Position einzelner Vektoren zum Container an, wenn ein Master Icon Template Frame (32px, 24px, 20px oder 64px) in "Icon templates (open paths)" ausgewählt wird.

## Angezeigte Informationen

Für jeden Vektor im Container werden folgende Informationen angezeigt:

### Basis-Informationen

- **Name**: Name des Vektors
- **Typ**: "stroke" (hat Stroke) oder "fill only" (nur Fills, kein Stroke)
- **Stroke Width**: Strichstärke (falls vorhanden)
- **Layer Path**: Vollständiger Pfad durch alle übergeordneten Layer (z.B. "Container › Group 1 › Icon Frame › Vector Name")
- **Parent Frame**: Name des übergeordneten Frames (falls der Vektor in einem verschachtelten Frame liegt)

### Positions-Daten

- **Relative Position**: X/Y-Koordinaten relativ zum direkten Parent (entspricht Figma's Anzeige)
- **Absolute Position**: X/Y-Koordinaten relativ zum Container (für Safety Zone Berechnung)
- **Größe**: Breite × Höhe des Vektors

### Abstände zu den Rändern

Die Abstände zu allen vier Container-Rändern werden farbcodiert angezeigt:

- 🔴 **Rot** (< Minimum): Kritisch - Vektor verletzt Safety Zone
  - < 2px für Fill-Vektoren
  - < 3px für Stroke-Vektoren
- 🟡 **Gelb** (Minimum bis 5px): Warnung - Vektor ist nah am Rand
- 🟢 **Grün** (≥ 5px): OK - Vektor hat ausreichend Abstand

## Safety Zone Validierung

Das Plugin validiert automatisch, dass Vektoren den richtigen Abstand zum Container-Rand einhalten:

### Mindestabstände

- **Fill-Vektoren**: Minimum 2px vom Container-Rand
- **Stroke-Vektoren**: Minimum 3px vom Container-Rand

### Fehlermeldungen

Bei Verletzung der Safety Zone erscheint eine Fehlermeldung:

**Für Stroke-Vektoren:**

```
Check position of "handle" (stroke):
left edge is in safety area (2.99px, min: 3px)
```

**Für Fill-Vektoren:**

```
Check position of "background" (fill):
top edge is in safety area (1.50px, min: 2px)
```

## Technische Details

### Berechnung der absoluten Position

Die absolute Position wird berechnet, indem alle Offsets der übergeordneten Elemente (Groups, Frames) addiert werden:

```typescript
let absoluteX = vector.x;
let absoluteY = vector.y;

for (const parent of parentChain) {
  if ("x" in parent && "y" in parent) {
    absoluteX += parent.x;
    absoluteY += parent.y;
  }
}
```

### Vektor-Typen

Das Plugin unterscheidet zwischen:

1. **Stroke-Vektoren**: Haben Strokes (strokeWeight > 0)
   - Mindestabstand: 3px
   - Angezeigt als "(stroke)"

2. **Fill-Vektoren**: Haben nur Fills, keine Strokes
   - Mindestabstand: 2px
   - Angezeigt als "(fill)"

### Datenstruktur

```typescript
interface VectorPositionInfo {
  name: string;
  x: number; // Absolute X position in container
  y: number; // Absolute Y position in container
  relativeX: number; // X position relative to direct parent
  relativeY: number; // Y position relative to direct parent
  width: number;
  height: number;
  distanceFromEdges: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  strokeWeight?: number;
  isInFrame: boolean;
  parentFrameName?: string;
  layerPath: string[]; // Full path of parent layers
}
```

## Verwendung

1. Wähle einen Master Icon Template Frame (32px, 24px, 20px oder 64px) in "Icon templates (open paths)" aus
2. Öffne das db-icon-studio Plugin
3. Die Vektor-Positionen werden automatisch unter den Validierungsergebnissen angezeigt
4. Nutze die farbcodierten Abstände, um zu prüfen, ob alle Vektoren die Safety Zone einhalten
5. Fehlermeldungen zeigen genau an, welche Vektoren zu nah am Rand sind

## Beispiel-Ausgabe

```
Vector Positions (3)

┌─────────────────────────────────────────────────┐
│ Rectangle 1                        2px stroke   │
│ Layer: Container › Group 1 › Rectangle 1        │
│ ⚠️ in nested Frame: Icon Frame                  │
│                                                 │
│ Relative: x=1.00, y=0.99                        │
│ Absolute: x=8.00, y=7.99                        │
│ Size: 16.00 × 16.00                             │
│                                                 │
│ Distance from edges:                            │
│ ← 8.00px  ↑ 7.99px                              │
│ → 8.00px  ↓ 8.01px                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Background                         fill only    │
│ Layer: Container › Background                   │
│                                                 │
│ Relative: x=2.00, y=2.00                        │
│ Absolute: x=2.00, y=2.00                        │
│ Size: 28.00 × 28.00                             │
│                                                 │
│ Distance from edges:                            │
│ ← 2.00px  ↑ 2.00px                              │
│ → 2.00px  ↓ 2.00px                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Path 2                             2px stroke   │
│ Layer: Container › Path 2                       │
│                                                 │
│ Relative: x=5.00, y=5.00                        │
│ Absolute: x=5.00, y=5.00                        │
│ Size: 22.00 × 22.00                             │
│                                                 │
│ Distance from edges:                            │
│ ← 5.00px  ↑ 5.00px                              │
│ → 5.00px  ↓ 5.00px                              │
└─────────────────────────────────────────────────┘
```

## Vorteile

- **Transparenz**: Entwickler sehen genau, wo sich Vektoren befinden
- **Debugging**: Einfaches Identifizieren von Positionsproblemen
- **Qualitätssicherung**: Automatische Überprüfung der Safety Zone-Einhaltung
- **Unterscheidung**: Separate Validierung für Fill- und Stroke-Vektoren
- **Präzision**: Anzeige mit 2 Dezimalstellen für genaue Positionierung
- **Dokumentation**: Automatische Dokumentation der Icon-Struktur
