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

// Slider-Werte: -8..+8 → Saaty 1/9..9
function sliderToSaaty(val) {
  if (val === 0) return 1;
  if (val > 0) return val + 1;
  return 1 / (-val + 1);
}

function saatyToLabel(val) {
  if (val === 1) return "Gleich";
  if (val <= 2) return "Etwas wichtiger";
  if (val <= 4) return "Wichtiger";
  if (val <= 6) return "Viel wichtiger";
  return "Extrem wichtiger";
}

export default function AHPVergleiche({ onComplete }) {
  const n = KRITERIEN.length;
  const paare = generiereVergleichsPaare(n);
  const [sliderValues, setSliderValues] = useState(paare.map(() => 0));
  const [matrix, setMatrix] = useState(erstelleLeereAHPMatrix(n));
  const [gewichte, setGewichte] = useState(null);
  const [konsistenz, setKonsistenz] = useState(null);

  const berechne = useCallback(
    (aktuelleMatrix) => {
      const g = berechneAHPGewichte(aktuelleMatrix);
      const k = pruefeKonsistenz(aktuelleMatrix, g);
      setGewichte(g);
      setKonsistenz(k);
      if (onComplete) {
        onComplete(aktuelleMatrix, g, k);
      }
    },
    [onComplete]
  );

  useEffect(() => {
    berechne(matrix);
  }, []);

  const handleSlider = (paarIndex, value) => {
    const intVal = parseInt(value);
    const neuSliders = [...sliderValues];
    neuSliders[paarIndex] = intVal;
    setSliderValues(neuSliders);

    const paar = paare[paarIndex];
    const saatyWert = sliderToSaaty(intVal);
    const neueMatrix = setzeVergleich(matrix, paar.i, paar.j, saatyWert);
    setMatrix(neueMatrix);
    berechne(neueMatrix);
  };

  const crClass = !konsistenz
    ? ""
    : konsistenz.CR < 0.05
    ? "ok"
    : konsistenz.CR < 0.1
    ? "warn"
    : "bad";

  return (
    <div>
      <div className="card">
        <h2 className="card-title">⚖️ AHP – Paarweise Kriterienvergleiche</h2>
        <p className="card-subtitle">
          Vergleicht jedes Kriterium paarweise: Schiebt den Regler in Richtung
          des wichtigeren Kriteriums. Bei 5 Kriterien sind es {paare.length}{" "}
          Vergleiche.
        </p>

        {paare.map((paar, idx) => {
          const sliderVal = sliderValues[idx];
          const saatyVal = sliderToSaaty(sliderVal);
          const absVal = Math.abs(sliderVal);
          const dominantSide =
            sliderVal < 0 ? KRITERIEN[paar.j].name : KRITERIEN[paar.i].name;
          const displayVal =
            sliderVal === 0 ? "1" : saatyVal > 1 ? saatyVal.toFixed(0) : `1/${(1 / saatyVal).toFixed(0)}`;

          return (
            <div key={idx} className="comparison-card">
              <div className="comparison-header">
                <span style={{ color: sliderVal > 0 ? "var(--blue-600)" : "var(--gray-500)", fontWeight: sliderVal > 0 ? 700 : 400 }}>
                  {KRITERIEN[paar.i].name}
                </span>
                <span style={{ fontSize: 12, color: "var(--gray-400)" }}>vs.</span>
                <span style={{ color: sliderVal < 0 ? "var(--blue-600)" : "var(--gray-500)", fontWeight: sliderVal < 0 ? 700 : 400 }}>
                  {KRITERIEN[paar.j].name}
                </span>
              </div>
              <div className="comparison-slider-container">
                <span className="comparison-label" style={{ textAlign: "right" }}>
                  ← {KRITERIEN[paar.i].name}
                </span>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  value={sliderVal}
                  onChange={(e) => handleSlider(idx, e.target.value)}
                  className="comparison-slider"
                />
                <span className="comparison-label" style={{ textAlign: "left" }}>
                  {KRITERIEN[paar.j].name} →
                </span>
                <span className="comparison-value">{displayVal}</span>
              </div>
              {sliderVal !== 0 && (
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
                  {dominantSide} ist {saatyToLabel(absVal + 1)} (
                  {absVal + 1}×)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Konsistenz-Anzeige */}
      {konsistenz && (
        <div className="card">
          <h2 className="card-title">📊 AHP-Ergebnis</h2>

          <div className={`consistency-bar ${crClass}`}>
            <div className="consistency-indicator" />
            <div>
              <strong>
                Konsistenz-Ratio: CR = {konsistenz.CR.toFixed(4)}
              </strong>
              <span style={{ marginLeft: 8, fontSize: 13 }}>
                {konsistenz.konsistent
                  ? "✓ Konsistent (CR < 0,1)"
                  : "✗ Inkonsistent – bitte Vergleiche überprüfen"}
              </span>
            </div>
          </div>

          {/* Gewichte-Balken */}
          {gewichte && (
            <div className="weight-bars" style={{ marginTop: 20 }}>
              {KRITERIEN.map((k, i) => (
                <div key={k.id} className="weight-row">
                  <span className="weight-label">{k.name}</span>
                  <div className="weight-bar-bg">
                    <div
                      className="weight-bar-fill"
                      style={{ width: `${gewichte[i] * 100}%` }}
                    />
                  </div>
                  <span className="weight-value">
                    {(gewichte[i] * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
