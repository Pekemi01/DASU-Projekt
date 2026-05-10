"use client";

import { useState, useEffect, useCallback } from "react";
import {
    KRITERIEN,
    generiereVergleichsPaare,
    erstelleLeereAHPMatrix,
    setzeVergleich,
    berechneAHPGewichte,
    pruefeKonsistenz,
} from "@/lib/scoring-engine";

export default function WeightingPage() {
    const n = KRITERIEN.length;
    const paare = generiereVergleichsPaare(n);

    // States
    const [sliderValues, setSliderValues] = useState(paare.map(() => 0));
    const [matrix, setMatrix] = useState(erstelleLeereAHPMatrix(n));
    const [gewichte, setGewichte] = useState(null);
    const [konsistenz, setKonsistenz] = useState(null);

    // Hilfsfunktion: Slider (-8 bis 8) zu Saaty (1/9 bis 9)
    const sliderToSaaty = (val) => {
        if (val === 0) return 1;
        if (val > 0) return val + 1;
        return 1 / (-val + 1);
    };

    const berechneErgebnisse = useCallback((aktuelleMatrix) => {
        const g = berechneAHPGewichte(aktuelleMatrix);
        const k = pruefeKonsistenz(aktuelleMatrix, g);
        setGewichte(g);
        setKonsistenz(k);
    }, []);

    // Initialberechnung
    useEffect(() => {
        berechneErgebnisse(matrix);
    }, [berechneErgebnisse, matrix]);

    const handleSliderChange = (idx, value) => {
        const intVal = parseInt(value);

        // Slider State updaten
        const neueSliders = [...sliderValues];
        neueSliders[idx] = intVal;
        setSliderValues(neueSliders);

        // Matrix updaten
        const paar = paare[idx];
        const saatyWert = sliderToSaaty(intVal);
        const neueMatrix = setzeVergleich(matrix, paar.i, paar.j, saatyWert);
        setMatrix(neueMatrix);

        // Rechnen
        berechneErgebnisse(neueMatrix);
    };

    return (
        <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1>AHP Gewichtung</h1>

            {/* Sektion 1: Vergleiche */}
            <section>
                <h2>Paarweise Vergleiche</h2>
                {paare.map((paar, idx) => (
                    <div key={idx} style={{ marginBottom: "15px", borderBottom: "1px solid #ccc" }}>
                        <p>
                            <strong>{KRITERIEN[paar.i].name}</strong> vs. <strong>{KRITERIEN[paar.j].name}</strong>
                        </p>
                        <input
                            type="range"
                            min="-8"
                            max="8"
                            step="1"
                            value={sliderValues[idx]}
                            onChange={(e) => handleSliderChange(idx, e.target.value)}
                            style={{ width: "300px" }}
                        />
                        <span> Wert: {sliderToSaaty(sliderValues[idx]).toFixed(2)}</span>
                    </div>
                ))}
            </section>

            <hr />

            {/* Sektion 2: Ergebnisse */}
            <section>
                <h2>Ergebnisse</h2>

                {konsistenz && (
                    <div style={{ marginBottom: "20px" }}>
                        <p><strong>Consistency Ratio (CR):</strong> {konsistenz.CR.toFixed(4)}</p>
                        <p style={{ color: konsistenz.konsistent ? "green" : "red" }}>
                            Status: {konsistenz.konsistent ? "Konsistent" : "Inkonsistent (bitte korrigieren)"}
                        </p>
                    </div>
                )}

                {gewichte && (
                    <ul>
                        {KRITERIEN.map((k, i) => (
                            <li key={k.id}>
                                {k.name}: <strong>{(gewichte[i] * 100).toFixed(1)}%</strong>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Sektion 3: Navigation */}
            <nav style={{ marginTop: "30px" }}>
                <button onClick={() => window.history.back()}>Zurück</button>
                <button
                    disabled={!konsistenz?.konsistent}
                    onClick={() => alert("Weiter zu Schritt 3")}
                    style={{ marginLeft: "10px" }}
                >
                    Weiter
                </button>
            </nav>
        </main>
    );
}