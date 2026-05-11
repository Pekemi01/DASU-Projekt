"use client";

import { useState, useEffect, useCallback } from "react";

// ── Kriterien ────────────────────────────────────────────────
const KRITERIEN = [
    { id: "sauberkeit",       name: "Sauberkeit" },
    { id: "sicherheit",       name: "Sicherheit" },
    { id: "sozialeAkzeptanz", name: "Soziale Akzeptanz" },
    { id: "nachhaltigkeit",   name: "Nachhaltigkeit" },
    { id: "kosten",           name: "Kosten" },
];

// ── AHP-Hilfsfunktionen ──────────────────────────────────────

function erstelleLeereAHPMatrix(n) {
    return Array.from({ length: n }, () => Array(n).fill(1));
}

function setzeVergleich(matrix, i, j, wert) {
    const neu = matrix.map((row) => [...row]);
    neu[i][j] = wert;
    neu[j][i] = 1 / wert;
    return neu;
}

function generiereVergleichsPaare(n) {
    const paare = [];
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            paare.push({ i, j });
    return paare;
}

function berechneAHPGewichte(matrix) {
    const n = matrix.length;
    const geoMittel = matrix.map((row) => {
        const produkt = row.reduce((p, v) => p * v, 1);
        return Math.pow(produkt, 1 / n);
    });
    const summe = geoMittel.reduce((s, v) => s + v, 0);
    return geoMittel.map((v) => v / summe);
}

function pruefeKonsistenz(matrix, gewichte) {
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

// Slider-Wert (-8…8) → Saaty-Skala (1/9…9)
function sliderToSaaty(val) {
    if (val === 0) return 1;
    if (val > 0) return val + 1;
    return 1 / (-val + 1);
}

function sliderLabel(val) {
    const s = sliderToSaaty(val);
    if (val === 0) return "gleich wichtig (1)";
    if (val > 0) return `linkes Kriterium bevorzugt (${s.toFixed(2)}×)`;
    return `rechtes Kriterium bevorzugt (${s.toFixed(2)}×)`;
}

// ── Komponente ───────────────────────────────────────────────

const n = KRITERIEN.length;
const PAARE = generiereVergleichsPaare(n);

export default function WeightingPage() {
    const [sliderValues, setSliderValues] = useState(PAARE.map(() => 0));
    const [matrix, setMatrix]             = useState(erstelleLeereAHPMatrix(n));
    const [gewichte, setGewichte]         = useState(null);
    const [konsistenz, setKonsistenz]     = useState(null);
    const [massnahmeDaten, setMassnahmeDaten] = useState(null);

    // Maßnahmen-Daten aus sessionStorage lesen
    useEffect(() => {
        const raw = sessionStorage.getItem("massnahme_daten");
        if (raw) {
            try { setMassnahmeDaten(JSON.parse(raw)); } catch (_) {}
        }
    }, []);

    const berechneErgebnisse = useCallback((m) => {
        const g = berechneAHPGewichte(m);
        const k = pruefeKonsistenz(m, g);
        setGewichte(g);
        setKonsistenz(k);
    }, []);

    // Initialberechnung (alle Slider auf 0 → Einheitsmatrix)
    useEffect(() => { berechneErgebnisse(matrix); }, []);   // eslint-disable-line

    const handleSlider = (idx, raw) => {
        const val = parseInt(raw);
        const neueSliders = sliderValues.map((v, i) => i === idx ? val : v);
        setSliderValues(neueSliders);

        const neueMatrix = setzeVergleich(matrix, PAARE[idx].i, PAARE[idx].j, sliderToSaaty(val));
        setMatrix(neueMatrix);
        berechneErgebnisse(neueMatrix);
    };

    // Gewichteten Gesamtscore berechnen (wenn Maßnahmen-Daten vorhanden)
    const gesamtScore = gewichte && massnahmeDaten
        ? KRITERIEN.reduce((sum, k, i) => {
            const wert = parseFloat(massnahmeDaten[k.name] ?? 0);
            return sum + gewichte[i] * wert;
          }, 0)
        : null;

    return (
        <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
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
                {PAARE.map((paar, idx) => (
                    <div key={idx} style={{
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
                            value={sliderValues[idx]}
                            onChange={(e) => handleSlider(idx, e.target.value)}
                            style={{ width: "100%", accentColor: "#0070f3" }}
                        />
                        <div style={{ textAlign: "center", fontSize: "0.88em", color: "#444", marginTop: 4 }}>
                            {sliderLabel(sliderValues[idx])}
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
                            <strong>Consistency Ratio (CR):</strong> {konsistenz.CR.toFixed(4)}
                            &nbsp;
                            <span style={{ color: konsistenz.konsistent ? "green" : "red", fontWeight: "bold" }}>
                                {konsistenz.konsistent ? "✓ Konsistent" : "✗ Inkonsistent (bitte korrigieren)"}
                            </span>
                        </p>
                        <p style={{ margin: 0, fontSize: "0.85em", color: "#666" }}>
                            λ<sub>max</sub> = {konsistenz.lambdaMax} &nbsp;|&nbsp; CI = {konsistenz.CI}
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
                            {KRITERIEN.map((k, i) => {
                                const roh = massnahmeDaten ? parseFloat(massnahmeDaten[k.name] ?? 0) : null;
                                const beitrag = roh !== null ? (gewichte[i] * roh) : null;
                                return (
                                    <tr key={k.id}>
                                        <td style={tdStyle}>{k.name}</td>
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
                                                {roh !== null ? roh.toFixed(4) : "—"}
                                            </td>
                                        )}
                                        {massnahmeDaten && (
                                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                                                {beitrag !== null ? beitrag.toFixed(4) : "—"}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        {massnahmeDaten && gesamtScore !== null && (
                            <tfoot>
                                <tr>
                                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                                        Gesamtscore:
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#0070f3" }}>
                                        {gesamtScore.toFixed(4)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </section>

            {/* ── Navigation ── */}
            <nav style={{ marginTop: 30, display: "flex", gap: 10 }}>
                <button onClick={() => window.history.back()}>Zurück</button>
                <button
                    disabled={!konsistenz?.konsistent}
                    onClick={() => alert("Weiter zu Schritt 3")}
                    style={{ opacity: konsistenz?.konsistent ? 1 : 0.5 }}
                >
                    Weiter
                </button>
            </nav>
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
