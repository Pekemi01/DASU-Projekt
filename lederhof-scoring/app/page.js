"use client";

import { useState, useCallback } from "react";
import SauberkeitCheck from "@/components/SauberkeitCheck";
import RisikoMatrix from "@/components/RisikoMatrix";
import AkzeptanzInput from "@/components/AkzeptanzInput";
import NachhaltigkeitInput from "@/components/NachhaltigkeitInput";
import KostenInput from "@/components/KostenInput";
import AHPVergleiche from "@/components/AHPVergleiche";
import MassnahmenEingabe from "@/components/MassnahmenEingabe";
import ErgebnisDashboard from "@/components/ErgebnisDashboard";

const STEPS = [
  { id: 1, label: "Metriken", icon: "📋" },
  { id: 2, label: "AHP-Gewichtung", icon: "⚖️" },
  { id: 3, label: "Maßnahmen", icon: "📊" },
  { id: 4, label: "Ergebnis", icon: "🏆" },
];

export default function Home() {
  const [activeStep, setActiveStep] = useState(1);
  const [ahpMatrix, setAhpMatrix] = useState(null);
  const [ahpGewichte, setAhpGewichte] = useState(null);
  const [konsistenz, setKonsistenz] = useState(null);
  const [massnahmen, setMassnahmen] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAHPComplete = useCallback((matrix, gewichte, kons) => {
    setAhpMatrix(matrix);
    setAhpGewichte(gewichte);
    setKonsistenz(kons);
  }, []);

  const handleBerechnen = async (massnahmenDaten) => {
    setMassnahmen(massnahmenDaten);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ahpMatrix,
          massnahmen: massnahmenDaten,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Berechnung fehlgeschlagen");
      }

      const data = await response.json();
      setErgebnis(data);
      setActiveStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏛️ Lederhof Scoring-Modell</h1>
        <p>
          Multikriterielle Maßnahmenbewertung mit AHP-TOPSIS Hybrid-Verfahren
        </p>
      </header>

      {/* Stepper */}
      <nav className="stepper">
        {STEPS.map((step) => (
          <button
            key={step.id}
            className={`step-btn ${activeStep === step.id ? "active" : ""}`}
            onClick={() => setActiveStep(step.id)}
          >
            <span className="step-number">{step.id}</span>
            {step.icon} {step.label}
          </button>
        ))}
      </nav>

      {/* Error Display */}
      {error && (
        <div
          className="card"
          style={{
            background: "var(--red-50)",
            borderLeft: "4px solid var(--red-500)",
          }}
        >
          <strong>Fehler:</strong> {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 12, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Metriken-Übersicht */}
      {activeStep === 1 && (
        <div>
          <div className="card">
            <h2 className="card-title">📋 Metrik-Definitionen</h2>
            <p className="card-subtitle">
              Hier seht ihr, wie jedes Kriterium gemessen wird. Diese Metriken
              liefern die Rohwerte für die Bewertungsmatrix in Schritt 3.
            </p>
          </div>

          <SauberkeitCheck />
          <RisikoMatrix />
          <AkzeptanzInput />
          <NachhaltigkeitInput />
          <KostenInput />

          <div className="actions">
            <div />
            <button
              className="btn btn-primary"
              onClick={() => setActiveStep(2)}
            >
              Weiter zu AHP-Gewichtung →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AHP */}
      {activeStep === 2 && (
        <div>
          <AHPVergleiche onComplete={handleAHPComplete} />
          <div className="actions">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveStep(1)}
            >
              ← Zurück
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActiveStep(3)}
              disabled={!konsistenz?.konsistent}
            >
              {konsistenz?.konsistent
                ? "Weiter zu Maßnahmen →"
                : "Vergleiche erst konsistent machen"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Maßnahmen eingeben */}
      {activeStep === 3 && (
        <div>
          <MassnahmenEingabe
            gewichte={ahpGewichte}
            onBerechnen={handleBerechnen}
            loading={loading}
          />
          <div className="actions">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveStep(2)}
            >
              ← Zurück
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Ergebnis */}
      {activeStep === 4 && ergebnis && (
        <div>
          <ErgebnisDashboard ergebnis={ergebnis} massnahmen={massnahmen} />
          <div className="actions">
            <button
              className="btn btn-secondary"
              onClick={() => setActiveStep(3)}
            >
              ← Maßnahmen anpassen
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setActiveStep(2)}
            >
              ⚖️ Gewichtung ändern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
