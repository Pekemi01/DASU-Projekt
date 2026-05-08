"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { KRITERIEN } from "@/lib/scoring-engine";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#4f46e5", "#be185d"];

export default function ErgebnisDashboard({ ergebnis, massnahmen }) {
  if (!ergebnis) return null;

  const { gewichte, konsistenz, ranking } = ergebnis;

  // Bar chart data
  const barData = ranking.map((r) => ({
    name: r.name,
    score: Number((r.score * 100).toFixed(1)),
  }));

  // Radar chart data: normalize values per criterion for visual comparison
  const radarData = KRITERIEN.map((k, kIdx) => {
    const punkt = { kriterium: k.name };
    massnahmen.forEach((m) => {
      // Normalize: find min/max in column, scale to 0-100
      const spalte = massnahmen.map((mm) => mm.werte[kIdx]);
      const min = Math.min(...spalte);
      const max = Math.max(...spalte);
      const range = max - min || 1;
      let normiert = ((m.werte[kIdx] - min) / range) * 100;
      // Für Minimierungskriterien invertieren
      if (k.typ === "min") normiert = 100 - normiert;
      punkt[m.name] = Number(normiert.toFixed(1));
    });
    return punkt;
  });

  return (
    <div>
      {/* Ranking */}
      <div className="card">
        <h2 className="card-title">🏆 TOPSIS-Ranking</h2>
        <p className="card-subtitle">
          Score von 0 bis 1. Je höher, desto näher an der Ideallösung.
          Konsistenz: CR = {konsistenz.CR} {konsistenz.konsistent ? "✓" : "✗"}
        </p>

        {ranking.map((r, i) => (
          <div key={r.name} className="ranking-item">
            <div className="ranking-position">{r.rang}</div>
            <div className="ranking-info">
              <div className="ranking-name">{r.name}</div>
              <div className="ranking-score-bar">
                <div
                  className="ranking-score-fill"
                  style={{
                    width: `${r.score * 100}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                D⁺ = {r.dPlus} | D⁻ = {r.dMinus}
              </div>
            </div>
            <div className="ranking-score-value">
              {(r.score * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Gewichte */}
      <div className="card">
        <h2 className="card-title">⚖️ Kriteriengewichte (AHP)</h2>
        <div className="weight-bars">
          {gewichte.map((g) => (
            <div key={g.id} className="weight-row">
              <span className="weight-label">{g.name}</span>
              <div className="weight-bar-bg">
                <div
                  className="weight-bar-fill"
                  style={{ width: `${g.prozent}%` }}
                />
              </div>
              <span className="weight-value">{g.prozent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card">
        <h2 className="card-title">📊 Score-Vergleich</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 120 }}>
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="card">
        <h2 className="card-title">🕸️ Kriterien-Profil (Radardiagramm)</h2>
        <p className="card-subtitle">
          Zeigt die Stärken und Schwächen jeder Maßnahme über alle Kriterien hinweg.
          Werte normalisiert auf 0–100 (höher = besser, auch bei Minimierungskriterien).
        </p>
        <div className="chart-container" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="kriterium" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              {massnahmen.map((m, i) => (
                <Radar
                  key={m.name}
                  name={m.name}
                  dataKey={m.name}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail-Tabelle */}
      <div className="card">
        <h2 className="card-title">📋 Detailergebnisse</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="risk-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Maßnahme</th>
                <th>Score</th>
                <th>D⁺ (Abstand Ideal)</th>
                <th>D⁻ (Abstand Negativ)</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 700 }}>{r.rang}</td>
                  <td>{r.name}</td>
                  <td style={{ fontWeight: 700, color: "var(--blue-600)" }}>
                    {r.score.toFixed(4)}
                  </td>
                  <td>{r.dPlus}</td>
                  <td>{r.dMinus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
