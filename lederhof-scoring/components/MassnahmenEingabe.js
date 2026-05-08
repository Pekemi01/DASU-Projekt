"use client";

import { useState } from "react";
import { KRITERIEN, BEISPIEL_MASSNAHMEN } from "@/lib/scoring-engine";

export default function MassnahmenEingabe({ gewichte, onBerechnen, loading }) {
  const [massnahmen, setMassnahmen] = useState(
    BEISPIEL_MASSNAHMEN.map((m) => ({
      name: m.name,
      werte: [...m.werte],
    }))
  );

  const updateName = (idx, name) => {
    const neu = [...massnahmen];
    neu[idx] = { ...neu[idx], name };
    setMassnahmen(neu);
  };

  const updateWert = (mIdx, kIdx, value) => {
    const neu = [...massnahmen];
    neu[mIdx] = {
      ...neu[mIdx],
      werte: neu[mIdx].werte.map((v, i) => (i === kIdx ? Number(value) : v)),
    };
    setMassnahmen(neu);
  };

  const addMassnahme = () => {
    setMassnahmen([
      ...massnahmen,
      { name: `Maßnahme ${massnahmen.length + 1}`, werte: KRITERIEN.map(() => 0) },
    ]);
  };

  const removeMassnahme = (idx) => {
    if (massnahmen.length <= 2) return;
    setMassnahmen(massnahmen.filter((_, i) => i !== idx));
  };

  const canCalculate = massnahmen.length >= 2 && massnahmen.every(
    (m) => m.name.trim() && m.werte.every((v) => v > 0)
  );

  return (
    <div className="card">
      <h2 className="card-title">📊 Maßnahmen bewerten</h2>
      <p className="card-subtitle">
        Tragt die Metrik-Rohwerte für jede Maßnahme ein. Die Werte kommen aus
        den Erhebungen in Schritt 1 (Sauberkeits-%, Risikoscore, Akzeptanz-%,
        Resilienz Rₘ, Effizienz Rₑ).
      </p>

      {/* Gewichte-Übersicht */}
      {gewichte && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            padding: 12,
            background: "var(--blue-50)",
            borderRadius: "var(--radius)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--blue-600)" }}>
            AHP-Gewichte:
          </span>
          {KRITERIEN.map((k, i) => (
            <span
              key={k.id}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                background: "white",
                borderRadius: 12,
                color: "var(--gray-700)",
              }}
            >
              {k.name}: {(gewichte[i] * 100).toFixed(1)}%
            </span>
          ))}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="massnahmen-input">
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Maßnahme</th>
              {KRITERIEN.map((k) => (
                <th key={k.id}>
                  {k.name}
                  <br />
                  <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>
                    ({k.typ === "min" ? "↓ weniger=besser" : "↑ mehr=besser"})
                  </span>
                </th>
              ))}
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {massnahmen.map((m, mIdx) => (
              <tr key={mIdx}>
                <td>
                  <input
                    value={m.name}
                    onChange={(e) => updateName(mIdx, e.target.value)}
                    style={{ width: "100%", textAlign: "left", fontWeight: 500 }}
                  />
                </td>
                {KRITERIEN.map((k, kIdx) => (
                  <td key={k.id}>
                    <input
                      type="number"
                      step={k.id === "nachhaltigkeit" ? "0.01" : k.id === "kosten" ? "0.001" : "1"}
                      value={m.werte[kIdx]}
                      onChange={(e) => updateWert(mIdx, kIdx, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => removeMassnahme(mIdx)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: massnahmen.length <= 2 ? "not-allowed" : "pointer",
                      opacity: massnahmen.length <= 2 ? 0.3 : 1,
                      fontSize: 16,
                    }}
                    disabled={massnahmen.length <= 2}
                    title="Maßnahme entfernen"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={addMassnahme}>
          + Maßnahme hinzufügen
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onBerechnen(massnahmen)}
          disabled={!canCalculate || loading}
        >
          {loading ? "Berechne..." : "🏆 Ranking berechnen"}
        </button>
      </div>
    </div>
  );
}
