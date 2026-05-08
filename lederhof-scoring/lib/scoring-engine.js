// ============================================================
// SCORING ENGINE: AHP-TOPSIS Hybrid-Modell
// Lederhof Maßnahmenbewertung
// ============================================================

// --- Standardkonfiguration ---
export const KRITERIEN = [
  { id: "sauberkeit",   name: "Sauberkeit",        typ: "max", beschreibung: "Binäre Checkliste (0–100%)" },
  { id: "sicherheit",   name: "Sicherheit",        typ: "min", beschreibung: "Risiko-Score nach DIN ISO 31000" },
  { id: "akzeptanz",    name: "Soziale Akzeptanz",  typ: "max", beschreibung: "Verweildauer-Anteil (0–100%)" },
  { id: "nachhaltigkeit", name: "Nachhaltigkeit",   typ: "max", beschreibung: "Resilienz-Rate Rₘ (0–1)" },
  { id: "kosten",       name: "Kosten",             typ: "max", beschreibung: "Effizienz-Ratio Rₑ" },
];

export const SAUBERKEIT_ITEMS = [
  "Es sind keine Spritzen auf dem Boden",
  "Es gibt keine Glasscherben",
  "Es liegt kein Papier, Plastik oder Holz auf dem Platz",
  "Es liegen keine Zigarettenkippen auf dem Boden",
  "Es liegen keine Flaschen auf dem Boden",
  "Es sind keine Exkremente auf dem Platz",
  "Die Mülleimer sind nicht mehr als 75 % voll",
  "Es sind keine Essensreste auf dem Platz",
  "Kein unerwünschtes Graffiti auf dem Platz",
  "Frei von klebrigen Substanzen/Flecken",
  "Es wurde nichts beschädigt",
];

export const RISIKO_SZENARIEN = [
  "Verletzung durch Spritzen/Glas",
  "Gewalttätige Auseinandersetzungen",
  "Belästigung von Passanten",
  "Brandgefahr (durch Müll/Feuer)",
  "Hygienische Belastung (Exkremente)",
];

// ============================================================
// METRIK-BERECHNUNGEN
// ============================================================

/**
 * Sauberkeit: Binäre Checkliste → Prozentwert
 * @param {boolean[]} checkliste - Array von true/false für jedes Item
 * @returns {number} Prozent (0-100)
 */
export function berechneSauberkeit(checkliste) {
  if (!checkliste || checkliste.length === 0) return 0;
  const jaCount = checkliste.filter((v) => v === true).length;
  return (jaCount / checkliste.length) * 100;
}

/**
 * Sicherheit: Risiko-Matrix → Aggregierter Risikowert
 * @param {{ wahrscheinlichkeit: number, schaden: number }[]} risiken
 * @returns {number} Summe aller Risikowerte
 */
export function berechneSicherheit(risiken) {
  if (!risiken || risiken.length === 0) return 0;
  return risiken.reduce((sum, r) => sum + r.wahrscheinlichkeit * r.schaden, 0);
}

/**
 * Bestimmt die Kritikalitätsstufe für einen Risikowert
 * @param {number} risikowert
 * @returns {{ stufe: string, farbe: string, beschreibung: string }}
 */
export function bestimmeKritikalitaet(risikowert) {
  if (risikowert <= 5) {
    return { stufe: "Gering", farbe: "#16a34a", beschreibung: "Sicherer öffentlicher Raum" };
  } else if (risikowert <= 15) {
    return { stufe: "Mittel", farbe: "#d97706", beschreibung: "Erhöhter Handlungsbedarf" };
  } else {
    return { stufe: "Hoch", farbe: "#dc2626", beschreibung: "Akute Gefährdung" };
  }
}

/**
 * Soziale Akzeptanz: Verweildauer-Anteil
 * @param {number} verweilPersonen - Nicht-Problemgruppe
 * @param {number} gesamtPersonen - Alle Personen
 * @returns {number} Prozent (0-100)
 */
export function berechneSozialeAkzeptanz(verweilPersonen, gesamtPersonen) {
  if (gesamtPersonen === 0) return 0;
  return (verweilPersonen / gesamtPersonen) * 100;
}

/**
 * Bestimmt die Akzeptanzstufe
 * @param {number} prozent
 * @returns {{ stufe: string, farbe: string }}
 */
export function bestimmeAkzeptanzStufe(prozent) {
  if (prozent <= 20) return { stufe: "Dominanz", farbe: "#dc2626" };
  if (prozent <= 50) return { stufe: "Koexistenz (instabil)", farbe: "#d97706" };
  if (prozent <= 80) return { stufe: "Integration", farbe: "#2563eb" };
  return { stufe: "Hohe Akzeptanz", farbe: "#16a34a" };
}

/**
 * Nachhaltigkeit: Resilienz-Rate Rₘ
 * @param {number} basiswert - Vor der Maßnahme
 * @param {number} zielwert - Direkt nach der Maßnahme
 * @param {number} aktuellerWert - Nach Zeitintervall
 * @returns {number} Resilienz-Rate (0-1+)
 */
export function berechneResilienz(basiswert, zielwert, aktuellerWert) {
  if (zielwert === basiswert) return 0;
  return (aktuellerWert - basiswert) / (zielwert - basiswert);
}

/**
 * Kosten: Effizienz-Ratio Rₑ
 * @param {number} scoreDelta - Verbesserung in Prozentpunkten
 * @param {number} kosten - Gesamtkosten in Euro
 * @returns {number} Effizienz-Ratio
 */
export function berechneEffizienz(scoreDelta, kosten) {
  if (kosten === 0) return 0;
  return scoreDelta / kosten;
}

// ============================================================
// AHP: Kriteriengewichtung
// ============================================================

/**
 * Berechnet AHP-Gewichte aus einer paarweisen Vergleichsmatrix
 * @param {number[][]} matrix - Quadratische reziproke Matrix (Saaty-Skala)
 * @returns {number[]} Normalisierte Gewichte (Summe = 1)
 */
export function berechneAHPGewichte(matrix) {
  const n = matrix.length;
  const geoMittel = matrix.map((row) => {
    const produkt = row.reduce((p, v) => p * v, 1);
    return Math.pow(produkt, 1 / n);
  });
  const summe = geoMittel.reduce((s, v) => s + v, 0);
  return geoMittel.map((v) => v / summe);
}

/**
 * Prüft die Konsistenz einer AHP-Vergleichsmatrix
 * @param {number[][]} matrix
 * @param {number[]} gewichte
 * @returns {{ lambdaMax: number, CI: number, CR: number, konsistent: boolean }}
 */
export function pruefeKonsistenz(matrix, gewichte) {
  const n = matrix.length;
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

  const lambdaVec = matrix.map((row, i) => {
    const ws = row.reduce((s, v, j) => s + v * gewichte[j], 0);
    return ws / gewichte[i];
  });
  const lambdaMax = lambdaVec.reduce((s, v) => s + v, 0) / n;

  const CI = (lambdaMax - n) / (n - 1);
  const CR = n <= 2 ? 0 : CI / RI[n - 1];

  return {
    lambdaMax: Number(lambdaMax.toFixed(4)),
    CI: Number(CI.toFixed(4)),
    CR: Number(CR.toFixed(4)),
    konsistent: CR < 0.1,
  };
}

/**
 * Erstellt eine leere reziproke AHP-Matrix
 * @param {number} n - Anzahl Kriterien
 * @returns {number[][]}
 */
export function erstelleLeereAHPMatrix(n) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = 1;
    }
  }
  return matrix;
}

/**
 * Setzt einen paarweisen Vergleich in der Matrix (inkl. reziprokem Wert)
 * @param {number[][]} matrix
 * @param {number} i - Zeile
 * @param {number} j - Spalte
 * @param {number} wert - Saaty-Wert (1-9)
 * @returns {number[][]} Aktualisierte Matrix
 */
export function setzeVergleich(matrix, i, j, wert) {
  const neu = matrix.map((row) => [...row]);
  neu[i][j] = wert;
  neu[j][i] = 1 / wert;
  return neu;
}

// ============================================================
// TOPSIS: Maßnahmenranking
// ============================================================

/**
 * Berechnet das TOPSIS-Ranking
 * @param {number[][]} matrix - Bewertungsmatrix (Zeilen=Maßnahmen, Spalten=Kriterien)
 * @param {number[]} gewichte - AHP-Gewichte
 * @param {{ typ: string }[]} kriterien - Kriterien mit typ "max" oder "min"
 * @param {string[]} namen - Namen der Maßnahmen
 * @returns {Array<{ name: string, dPlus: number, dMinus: number, score: number, rang: number }>}
 */
export function berechneTOPSIS(matrix, gewichte, kriterien, namen) {
  const m = matrix.length;
  const n = matrix[0].length;

  // 1. Vektornormalisierung
  const normMatrix = [];
  for (let i = 0; i < m; i++) {
    normMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      const norm = Math.sqrt(matrix.reduce((s, row) => s + row[j] ** 2, 0));
      normMatrix[i][j] = norm === 0 ? 0 : matrix[i][j] / norm;
    }
  }

  // 2. Gewichtete Matrix
  const gMatrix = normMatrix.map((row) => row.map((v, j) => v * gewichte[j]));

  // 3. Ideal- und Negativlösung
  const ideal = [];
  const negativ = [];
  for (let j = 0; j < n; j++) {
    const spalte = gMatrix.map((row) => row[j]);
    if (kriterien[j].typ === "min") {
      ideal[j] = Math.min(...spalte);
      negativ[j] = Math.max(...spalte);
    } else {
      ideal[j] = Math.max(...spalte);
      negativ[j] = Math.min(...spalte);
    }
  }

  // 4. Abstände und Score
  const ergebnisse = gMatrix.map((row, i) => {
    const dPlus = Math.sqrt(row.reduce((s, v, j) => s + (v - ideal[j]) ** 2, 0));
    const dMinus = Math.sqrt(row.reduce((s, v, j) => s + (v - negativ[j]) ** 2, 0));
    const score = dPlus + dMinus === 0 ? 0 : dMinus / (dPlus + dMinus);
    return {
      name: namen[i],
      dPlus: Number(dPlus.toFixed(4)),
      dMinus: Number(dMinus.toFixed(4)),
      score: Number(score.toFixed(4)),
    };
  });

  // 5. Sortieren und Rang vergeben
  ergebnisse.sort((a, b) => b.score - a.score);
  ergebnisse.forEach((r, i) => (r.rang = i + 1));

  return ergebnisse;
}

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

/**
 * Generiert alle paarweisen Vergleiche für n Kriterien
 * @param {number} n
 * @returns {{ i: number, j: number }[]}
 */
export function generiereVergleichsPaare(n) {
  const paare = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      paare.push({ i, j });
    }
  }
  return paare;
}

/**
 * Beispieldaten für Testzwecke
 */
export const BEISPIEL_MASSNAHMEN = [
  { name: "Smarte Mülleimer",   werte: [82, 8, 45, 0.72, 0.015] },
  { name: "Smarte Müllroboter", werte: [91, 9, 30, 0.55, 0.008] },
  { name: "Digitale Kunst",     werte: [36, 5, 70, 0.65, 0.022] },
  { name: "Mehr Beleuchtung",   werte: [45, 4, 60, 0.85, 0.018] },
  { name: "Community Events",   werte: [55, 6, 85, 0.45, 0.035] },
];

export const BEISPIEL_AHP_MATRIX = [
  [1,    3,    2,    1/2,  5  ],
  [1/3,  1,    1/2,  1/3,  3  ],
  [1/2,  2,    1,    1/2,  4  ],
  [2,    3,    2,    1,    5  ],
  [1/5,  1/3,  1/4,  1/5,  1  ],
];
