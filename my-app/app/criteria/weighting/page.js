/**
 * @author Milenko Pekez
 * @description Seite zur AHP-basierten Gewichtung der Kriterien und Berechnung des Gesamtscores.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';

// ── Kriterien ────────────────────────────────────────────────
const KRITERIEN = [
    { id: "sauberkeit",       name: "Sauberkeit" },
    { id: "sicherheit",       name: "Sicherheit" },
    { id: "sozialeAkzeptanz", name: "Soziale Akzeptanz" },
    { id: "nachhaltigkeit",   name: "Nachhaltigkeit" },
    { id: "kosten",           name: "Kosten" },
];

// ── AHP-Hilfsfunktionen ──────────────────────────────────────

/**
 * @description Erstellt eine leere AHP-Vergleichsmatrix der Größe n×n (alle Werte = 1).
 */
function erstelleLeereAHPMatrix(anzahlKriterien) {
    return Array.from({ length: anzahlKriterien }, () => Array(anzahlKriterien).fill(1));
}

/**
 * @description Setzt einen paarweisen Vergleich in der Matrix und aktualisiert den reziproken Wert.
 */
function setzeVergleich(matrix, zeilenIndex, spaltenIndex, vergleichswert) {
    const aktualisierteMatrix = matrix.map((zeile) => [...zeile]);
    aktualisierteMatrix[zeilenIndex][spaltenIndex] = vergleichswert;
    aktualisierteMatrix[spaltenIndex][zeilenIndex] = 1 / vergleichswert;
    return aktualisierteMatrix;
}

/**
 * @description Generiert alle paarweisen Vergleichspaare für n Kriterien.
 */
function generiereVergleichsPaare(anzahlKriterien) {
    const paare = [];
    for (let i = 0; i < anzahlKriterien; i++)
        for (let j = i + 1; j < anzahlKriterien; j++)
            paare.push({ i, j });
    return paare;
}

/**
 * @description Berechnet die normalisierten AHP-Gewichte über das geometrische Mittel.
 */
function berechneAHPGewichte(matrix) {
    const anzahlKriterien = matrix.length;
    const geometrischeMittelwerte = matrix.map((zeile) => {
        const produkt = zeile.reduce((akkumulator, wert) => akkumulator * wert, 1);
        return Math.pow(produkt, 1 / anzahlKriterien);
    });
    const summe = geometrischeMittelwerte.reduce((akkumulator, wert) => akkumulator + wert, 0);
    return geometrischeMittelwerte.map((wert) => wert / summe);
}

/**
 * @description Prüft die Konsistenz einer AHP-Matrix anhand des Consistency Ratio (CR).
 */
function pruefeKonsistenz(matrix, gewichte) {
    const anzahlKriterien = matrix.length;
    const zufallsKonsistenzIndex = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

    const lambdaVektor = matrix.map((zeile, i) => {
        const gewichteterZeilenwert = zeile.reduce((akkumulator, wert, j) => akkumulator + wert * gewichte[j], 0);
        return gewichteterZeilenwert / gewichte[i];
    });
    const lambdaMaximum = lambdaVektor.reduce((akkumulator, wert) => akkumulator + wert, 0) / anzahlKriterien;

    const konsistenzIndex = (lambdaMaximum - anzahlKriterien) / (anzahlKriterien - 1);
    const konsistenzRatio = anzahlKriterien <= 2 ? 0 : konsistenzIndex / zufallsKonsistenzIndex[anzahlKriterien - 1];

    return {
        lambdaMaximum: Number(lambdaMaximum.toFixed(4)),
        konsistenzIndex: Number(konsistenzIndex.toFixed(4)),
        konsistenzRatio: Number(konsistenzRatio.toFixed(4)),
        konsistent: konsistenzRatio < 0.1,
    };
}

/**
 * @description Konvertiert einen Slider-Wert (-8…8) in einen Saaty-Skalenwert (1/9…9).
 */
function konvertiereSliderZuSaaty(sliderWert) {
    if (sliderWert === 0) return 1;
    if (sliderWert > 0) return sliderWert + 1;
    return 1 / (-sliderWert + 1);
}

/**
 * @description Erstellt eine lesbare Beschriftung für einen Slider-Wert auf der Saaty-Skala.
 */
function erstelleSliderBeschriftung(sliderWert) {
    const saatyWert = konvertiereSliderZuSaaty(sliderWert);
    if (sliderWert === 0) return "gleich wichtig (1)";
    if (sliderWert > 0) return `linkes Kriterium bevorzugt (${saatyWert.toFixed(2)}×)`;
    return `rechtes Kriterium bevorzugt (${saatyWert.toFixed(2)}×)`;
}

// ── Komponente ───────────────────────────────────────────────

const anzahlKriterien = KRITERIEN.length;
const PAARE = generiereVergleichsPaare(anzahlKriterien);

/**
 * @description Hauptkomponente der Gewichtungsseite.
 * Verwaltet die AHP-Matrix, berechnet Gewichte und zeigt den gewichteten Gesamtscore an.
 */
export default function WeightingPage() {
    const [sliderWerte, setSliderWerte] = useState(PAARE.map(() => 0));
    const [matrix, setMatrix]                     = useState(erstelleLeereAHPMatrix(anzahlKriterien));
    const [gewichte, setGewichte]                 = useState(null);
    const [konsistenz, setKonsistenz]             = useState(null);
    const [massnahmeDaten, setMassnahmeDaten]     = useState(null);

    // Maßnahmen-Daten aus sessionStorage lesen
    useEffect(() => {
        const gespeicherteDatenJson = sessionStorage.getItem("massnahme_daten");
        if (gespeicherteDatenJson) {
            try { setMassnahmeDaten(JSON.parse(gespeicherteDatenJson)); } catch (_) {}
        }
    }, []);

    /**
     * @description Berechnet Gewichte und Konsistenz für eine gegebene AHP-Matrix und aktualisiert den State.
     */
    const berechneErgebnisse = useCallback((ahpMatrix) => {
        const berechneteGewichte = berechneAHPGewichte(ahpMatrix);
        const konsistenzErgebnis = pruefeKonsistenz(ahpMatrix, berechneteGewichte);
        setGewichte(berechneteGewichte);
        setKonsistenz(konsistenzErgebnis);
    }, []);

    // Initialberechnung (alle Slider auf 0 → Einheitsmatrix)
    useEffect(() => { berechneErgebnisse(matrix); }, []);   // eslint-disable-line

    /**
     * @description Verarbeitet eine Slider-Änderung, aktualisiert Matrix und berechnet neue Gewichte.
     */
    const handleSliderAenderung = (paarIndex, neuerSliderWert) => {
        const sliderWert = parseInt(neuerSliderWert);
        const aktualisierteSliderWerte = sliderWerte.map((wert, i) => i === paarIndex ? sliderWert : wert);
        setSliderWerte(aktualisierteSliderWerte);

        const aktualisierteMatrix = setzeVergleich(matrix, PAARE[paarIndex].i, PAARE[paarIndex].j, konvertiereSliderZuSaaty(sliderWert));
        setMatrix(aktualisierteMatrix);
        berechneErgebnisse(aktualisierteMatrix);
    };

    // Gewichteten Gesamtscore berechnen (wenn Maßnahmen-Daten vorhanden)
    const gewichteterGesamtScore = gewichte && massnahmeDaten
        ? KRITERIEN.reduce((summe, kriterium, i) => {
            const rohBewertung = parseFloat(massnahmeDaten[kriterium.name] ?? 0);
            return summe + gewichte[i] * rohBewertung;
          }, 0)
        : null;

    return (
        <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
            {/* Back Button*/}
            <Link href="/criteria">
                <button>← Zurück zur Kriterien Übersicht</button>
            </Link>
            <h1>AHP Gewichtung</h1>

            {/* ── Maßnahmen-Zusammenfassung ── */}
            {massnahmeDaten && (
                <section style={{
                    marginBottom: 24,
                    padding: 16,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    background: "#f9f9f9",
                }}>
                    <h2 style={{ marginTop: 0 }}>Maßnahme: {massnahmeDaten.name}</h2>
                    <p style={{ marginBottom: 8, fontWeight: "bold" }}>Kriterien-Bewertungen:</p>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Sauberkeit: {massnahmeDaten.Sauberkeit}</li>
                        <li>Sicherheit: {massnahmeDaten.Sicherheit}</li>
                        <li>Soziale Akzeptanz: {massnahmeDaten["Soziale Akzeptanz"]}</li>
                        <li>Nachhaltigkeit: {massnahmeDaten.Nachhaltigkeit}</li>
                        <li>Kosten (R<sub>e</sub>): {massnahmeDaten.Kosten}</li>
                    </ul>
                </section>
            )}

            {/* ── Sektion 1: Paarweise Vergleiche ── */}
            <section>
                <h2>Paarweise Vergleiche</h2>
                <p style={{ color: "#555", fontSize: "0.9em", marginTop: 0 }}>
                    Schieben Sie jeden Slider, um anzugeben, welches Kriterium wichtiger ist.
                </p>
                {PAARE.map((paar, paarIndex) => (
                    <div key={paarIndex} style={{
                        marginBottom: 16,
                        padding: "12px 0",
                        borderBottom: "1px solid #eee",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <strong>{KRITERIEN[paar.i].name}</strong>
                            <strong>{KRITERIEN[paar.j].name}</strong>
                        </div>
                        <input
                            type="range"
                            min="-8"
                            max="8"
                            step="1"
                            value={sliderWerte[paarIndex]}
                            onChange={(e) => handleSliderAenderung(paarIndex, e.target.value)}
                            style={{ width: "100%", accentColor: "#0070f3" }}
                        />
                        <div style={{ textAlign: "center", fontSize: "0.88em", color: "#444", marginTop: 4 }}>
                            {erstelleSliderBeschriftung(sliderWerte[paarIndex])}
                        </div>
                    </div>
                ))}
            </section>

            <hr style={{ margin: "24px 0" }} />

            {/* ── Sektion 2: Ergebnisse ── */}
            <section>
                <h2>Ergebnisse</h2>

                {konsistenz && (
                    <div style={{ marginBottom: 16, padding: 12, background: "#f5f5f5", borderRadius: 4 }}>
                        <p style={{ margin: "0 0 4px" }}>
                            <strong>Consistency Ratio (CR):</strong> {konsistenz.konsistenzRatio.toFixed(4)}
                            &nbsp;
                            <span style={{ color: konsistenz.konsistent ? "green" : "red", fontWeight: "bold" }}>
                                {konsistenz.konsistent ? "✓ Konsistent" : "✗ Inkonsistent (bitte korrigieren)"}
                            </span>
                        </p>
                        <p style={{ margin: 0, fontSize: "0.85em", color: "#666" }}>
                            λ<sub>max</sub> = {konsistenz.lambdaMaximum} &nbsp;|&nbsp; CI = {konsistenz.konsistenzIndex}
                        </p>
                    </div>
                )}

                {gewichte && (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Kriterium</th>
                                <th style={thStyle}>Gewicht</th>
                                <th style={thStyle}>Anteil</th>
                                {massnahmeDaten && <th style={thStyle}>Bewertung</th>}
                                {massnahmeDaten && <th style={thStyle}>Gewichteter Beitrag</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {KRITERIEN.map((kriterium, i) => {
                                const rohBewertung = massnahmeDaten ? parseFloat(massnahmeDaten[kriterium.name] ?? 0) : null;
                                const gewichteterBeitrag = rohBewertung !== null ? (gewichte[i] * rohBewertung) : null;
                                return (
                                    <tr key={kriterium.id}>
                                        <td style={tdStyle}>{kriterium.name}</td>
                                        <td style={{ ...tdStyle, textAlign: "right" }}>{(gewichte[i] * 100).toFixed(1)}%</td>
                                        <td style={{ ...tdStyle, padding: "6px 10px" }}>
                                            <div style={{
                                                height: 12,
                                                background: "#0070f3",
                                                width: `${(gewichte[i] * 100).toFixed(1)}%`,
                                                borderRadius: 2,
                                            }} />
                                        </td>
                                        {massnahmeDaten && (
                                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                                {rohBewertung !== null ? rohBewertung.toFixed(4) : "—"}
                                            </td>
                                        )}
                                        {massnahmeDaten && (
                                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                                                {gewichteterBeitrag !== null ? gewichteterBeitrag.toFixed(4) : "—"}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        {massnahmeDaten && gewichteterGesamtScore !== null && (
                            <tfoot>
                                <tr>
                                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                                        Gesamtscore:
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#0070f3" }}>
                                        {gewichteterGesamtScore.toFixed(4)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </section>
        </main>
    );
}

const thStyle = {
    border: "1px solid #ccc",
    padding: "6px 10px",
    background: "#f5f5f5",
    textAlign: "left",
};

const tdStyle = {
    border: "1px solid #ccc",
    padding: "6px 10px",
};
