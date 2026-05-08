"use client";

import { useState } from "react";
import { berechneResilienz } from "@/lib/scoring-engine";

export default function NachhaltigkeitInput() {
  const [basis, setBasis] = useState(30);
  const [ziel, setZiel] = useState(80);
  const [aktuell, setAktuell] = useState(65);

  const rm = berechneResilienz(basis, ziel, aktuell);
  const bewertung =
    rm >= 0.8
      ? { text: "Sehr nachhaltig", farbe: "#16a34a" }
      : rm >= 0.5
      ? { text: "Bedingt nachhaltig", farbe: "#d97706" }
      : { text: "Nicht nachhaltig", farbe: "#dc2626" };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title">♻️ Nachhaltigkeit – Resilienz-Rate (Rₘ)</h2>
        <span
          className="score-badge"
          style={{ background: bewertung.farbe + "20", color: bewertung.farbe }}
        >
          Rₘ = {rm.toFixed(2)} – {bewertung.text}
        </span>
      </div>
      <p className="card-subtitle">
        Rₘ = (Aktueller Wert − Basiswert) / (Zielwert − Basiswert). Drei Messpunkte in einer Zeitreihe.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)" }}>
            Basiswert (vorher)
          </label>
          <input
            type="number"
            value={basis}
            onChange={(e) => setBasis(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)", borderRadius: "var(--radius)", marginTop: 4, fontSize: 16 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)" }}>
            Zielwert (direkt nachher)
          </label>
          <input
            type="number"
            value={ziel}
            onChange={(e) => setZiel(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)", borderRadius: "var(--radius)", marginTop: 4, fontSize: 16 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)" }}>
            Aktueller Wert (nach 7 Tagen)
          </label>
          <input
            type="number"
            value={aktuell}
            onChange={(e) => setAktuell(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--gray-300)", borderRadius: "var(--radius)", marginTop: 4, fontSize: 16 }}
          />
        </div>
      </div>
    </div>
  );
}
