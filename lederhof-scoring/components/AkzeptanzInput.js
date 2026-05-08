"use client";

import { useState } from "react";
import { bestimmeAkzeptanzStufe } from "@/lib/scoring-engine";

export default function AkzeptanzInput() {
  const [verweil, setVerweil] = useState(50);
  const stufe = bestimmeAkzeptanzStufe(verweil);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title">👥 Soziale Akzeptanz – Verweildauer-Anteil</h2>
        <span
          className="score-badge"
          style={{ background: stufe.farbe + "20", color: stufe.farbe }}
        >
          {verweil} % – {stufe.stufe}
        </span>
      </div>
      <p className="card-subtitle">
        Anteil der Nicht-Problemgruppe an der Gesamtverweildauer. Gemessen per Kamera/Beobachtung.
      </p>

      <div style={{ padding: "16px 0" }}>
        <input
          type="range"
          min="0"
          max="100"
          value={verweil}
          onChange={(e) => setVerweil(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: stufe.farbe }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>
          <span>0% Dominanz</span>
          <span>50% Koexistenz</span>
          <span>80% Integration</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
