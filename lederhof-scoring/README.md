# 🏛️ Lederhof Scoring-Modell

Multikriterielle Maßnahmenbewertung mit AHP-TOPSIS Hybrid-Verfahren.

## Schnellstart

```bash
# 1. In den Projektordner wechseln
cd lederhof-scoring

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten
npm run dev

# 4. Im Browser öffnen
# → http://localhost:3000
```

## Projektstruktur

```
lederhof-scoring/
├── app/
│   ├── api/
│   │   ├── scoring/route.js    ← Backend: Komplette Berechnung (AHP + TOPSIS)
│   │   └── ahp/route.js        ← Backend: Echtzeit-AHP-Konsistenzprüfung
│   ├── globals.css              ← Alle Styles
│   ├── layout.js                ← Root Layout
│   └── page.js                  ← Hauptseite (Stepper-Logik)
├── components/
│   ├── SauberkeitCheck.js       ← Binäre Checkliste (11 Items)
│   ├── RisikoMatrix.js          ← Risiko-Tabelle nach DIN ISO 31000
│   ├── AkzeptanzInput.js        ← Verweildauer-Slider
│   ├── NachhaltigkeitInput.js   ← Resilienz-Rate Eingabe (3 Messpunkte)
│   ├── KostenInput.js           ← Effizienz-Ratio Eingabe
│   ├── AHPVergleiche.js         ← Paarweise Vergleiche mit Slidern
│   ├── MassnahmenEingabe.js     ← Bewertungsmatrix-Tabelle
│   └── ErgebnisDashboard.js     ← Ranking, Radar-Chart, Bar-Chart
├── lib/
│   └── scoring-engine.js        ← Kern-Algorithmus (AHP + TOPSIS + Metriken)
├── package.json
├── jsconfig.json
└── next.config.js
```

## Die 4 Schritte der App

| Schritt | Was passiert | Komponente |
|---------|-------------|------------|
| 1. Metriken | Metrik-Definitionen ansehen, Demo-Eingaben testen | SauberkeitCheck, RisikoMatrix, ... |
| 2. AHP-Gewichtung | Paarweise Vergleiche der 5 Kriterien, Konsistenzprüfung | AHPVergleiche |
| 3. Maßnahmen | Rohwerte pro Maßnahme eintragen | MassnahmenEingabe |
| 4. Ergebnis | TOPSIS-Ranking, Charts, Detailtabelle | ErgebnisDashboard |

## API-Endpunkte

### POST /api/scoring
Komplette Berechnung (AHP-Gewichte + TOPSIS-Ranking).

```json
// Request
{
  "ahpMatrix": [[1, 3, 2, 0.5, 5], ...],
  "massnahmen": [
    { "name": "Smarte Mülleimer", "werte": [82, 8, 45, 0.72, 0.015] }
  ]
}

// Response
{
  "gewichte": [{ "name": "Sauberkeit", "gewicht": 0.26, "prozent": 26.0 }, ...],
  "konsistenz": { "CR": 0.0312, "konsistent": true },
  "ranking": [{ "name": "Mehr Beleuchtung", "score": 0.668, "rang": 1 }, ...]
}
```

### POST /api/ahp
Nur AHP-Berechnung (für Echtzeit-Feedback bei Slider-Änderungen).

```json
// Request
{ "matrix": [[1, 3, 2, 0.5, 5], ...] }

// Response
{ "gewichte": [0.26, ...], "konsistenz": { "CR": 0.03, "konsistent": true } }
```

## Technologien

- **Next.js 14** – React-Framework mit integriertem Backend
- **Recharts** – Diagrammbibliothek (Radar, Bar)
- **Vanilla CSS** – Kein Tailwind/Bootstrap nötig

## Team-Aufgabenverteilung (Vorschlag)

| Rolle | Aufgaben |
|-------|----------|
| **Backend / Algorithmus** | `lib/scoring-engine.js`, API-Routes, Tests |
| **Frontend: Eingabe** | Sauberkeits-Checkliste, Risiko-Matrix, Slider-Komponenten |
| **Frontend: AHP** | AHP-Vergleiche, Konsistenz-Anzeige, Gewichte-Visualisierung |
| **Frontend: Dashboard** | Ranking, Charts, Detail-Tabelle, Export-Funktion |
