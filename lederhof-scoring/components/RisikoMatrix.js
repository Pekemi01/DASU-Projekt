"use client";

import { useState } from "react";
import {
  RISIKO_SZENARIEN,
  berechneSicherheit,
  bestimmeKritikalitaet,
} from "@/lib/scoring-engine";

const W_LABELS = ["", "Sehr gering", "Gering", "Mittel", "Hoch", "Sehr hoch"];
const S_LABELS = ["", "Unbedeutend", "Gering", "Mäßig", "Schwer", "Katastrophal"];

export default function RisikoMatrix() {
  const [risiken, setRisiken] = useState(
    RISIKO_SZENARIEN.map(() => ({ wahrscheinlichkeit: 1, schaden: 1 }))
  );

  const update = (index, field, value) => {
    const neu = [...risiken];
    neu[index] = { ...neu[index], [field]: parseInt(value) };
    setRisiken(neu);
  };

  const gesamtRisiko = berechneSicherheit(risiken);
  const gesamt = bestimmeKritikalitaet(gesamtRisiko);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title">🛡️ Sicherheit – Risiko-Matrix (DIN ISO 31000)</h2>
        <span
          className="score-badge"
          style={{
            background: gesamt.farbe + "20",
            color: gesamt.farbe,
          }}
        >
          {gesamtRisiko} Pkt – {gesamt.stufe}
        </span>
      </div>
      <p className="card-subtitle">
        Eintrittswahrscheinlichkeit (1–5) × Schadensausmaß (1–5) = Risikowert. Minimierungskriterium.
      </p>

      <table className="risk-table">
        <thead>
          <tr>
            <th>Szenario</th>
            <th>Wahrscheinlichkeit (W)</th>
            <th>Schadensausmaß (S)</th>
            <th>W × S</th>
            <th>Kritikalität</th>
          </tr>
        </thead>
        <tbody>
          {RISIKO_SZENARIEN.map((sz, i) => {
            const rw = risiken[i].wahrscheinlichkeit * risiken[i].schaden;
            const krit = bestimmeKritikalitaet(rw);
            return (
              <tr key={i}>
                <td>{sz}</td>
                <td>
                  <select
                    value={risiken[i].wahrscheinlichkeit}
                    onChange={(e) => update(i, "wahrscheinlichkeit", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v} – {W_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={risiken[i].schaden}
                    onChange={(e) => update(i, "schaden", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v} – {S_LABELS[v]}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ fontWeight: 700, color: krit.farbe }}>{rw}</td>
                <td style={{ color: krit.farbe, fontWeight: 600 }}>{krit.stufe}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
