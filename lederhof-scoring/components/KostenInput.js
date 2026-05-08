"use client";

import { useState } from "react";
import { berechneEffizienz } from "@/lib/scoring-engine";

export default function KostenInput() {
  const [scoreDelta, setScoreDelta] = useState(25);
  const [kosten, setKosten] = useState(5000);

  const re = berechneEffizienz(scoreDelta, kosten);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title">💰 Kosten – Effizienz-Ratio (Rₑ)</h2>
        <span className="score-badge good">
          Rₑ = {re.toFixed(4)}
        </span>
      </div>
      <p className="card-subtitle">
        Rₑ = ΔScore / Kosten. Misst die Qualitätsverbesserung pro investiertem Euro.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)" }}>
            Score-Verbesserung (ΔScore in %)
          </label>
          <input
            type="number"
            value={scoreDelta}
            onChange={(e) => setScoreDelta(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)", borderRadius: "var(--radius)", marginTop: 4, fontSize: 16 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)" }}>
            Gesamtkosten (€)
          </label>
          <input
            type="number"
            value={kosten}
            onChange={(e) => setKosten(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)", borderRadius: "var(--radius)", marginTop: 4, fontSize: 16 }}
          />
        </div>
      </div>
    </div>
  );
}
