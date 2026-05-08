"use client";

import { useState } from "react";
import { SAUBERKEIT_ITEMS, berechneSauberkeit } from "@/lib/scoring-engine";

export default function SauberkeitCheck() {
  const [checks, setChecks] = useState(SAUBERKEIT_ITEMS.map(() => false));

  const toggle = (index) => {
    const neu = [...checks];
    neu[index] = !neu[index];
    setChecks(neu);
  };

  const score = berechneSauberkeit(checks);
  const scoreClass = score >= 70 ? "good" : score >= 40 ? "warn" : "bad";

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-title">🧹 Sauberkeit – Binäre Checkliste</h2>
        <span className={`score-badge ${scoreClass}`}>
          {score.toFixed(0)} %
        </span>
      </div>
      <p className="card-subtitle">
        Jedes Item wird mit Ja/Nein beantwortet. Der Score ergibt sich aus dem Anteil der erfüllten Kriterien.
      </p>

      <div className="checklist">
        {SAUBERKEIT_ITEMS.map((item, i) => (
          <label
            key={i}
            className={`checklist-item ${checks[i] ? "checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={() => toggle(i)}
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}
