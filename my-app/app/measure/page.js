"use client";

import { useState } from "react";
import { createMeasureWithRating } from "@/lib/actions/massnahmen.js";

const SICHERHEITSFRAGEN = [
    "Sind Schutzausrüstungen vorhanden?",
    "Wurden Mitarbeiter eingewiesen?",
    "Gibt es Notfallpläne?",
    "Sind Gefahrenbereiche gekennzeichnet?",
    "Wurden Sicherheitsprüfungen durchgeführt?",
    "Sind Erste-Hilfe-Mittel verfügbar?",
    "Gibt es regelmäßige Sicherheitsunterweisungen?",
    "Sind alle gesetzlichen Vorgaben eingehalten?",
];

const RISIKEN = [
    "Stolpern / Stürzen",
    "Elektrische Gefährdung",
    "Chemische Exposition",
    "Ergonomische Belastung",
    "Psychische Belastung",
];

function berechneResilienz(vBase, vTarget, vNow) {
    if (vTarget === vBase) return 0;
    return (vNow - vBase) / (vTarget - vBase);
}

function berechneEffizienz(kosten, deltaS) {
    if (kosten === 0) return 0;
    return deltaS / kosten;
}

export default function MaßnahmePage() {
    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");

    // Sauberkeit (id_kriterium → "Sauberkeit")
    const [sicherheit, setSicherheit] = useState(Array(8).fill(false));

    // Soziale Akzeptanz (id_kriterium → "Soziale Akzeptanz")
    const [sozialeAkzeptanz, setSozialeAkzeptanz] = useState(50);

    // Sicherheit / Risikomatrix (id_kriterium → "Sicherheit")
    const [risikoMatrix, setRisikoMatrix] = useState(
        RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 }))
    );

    // Nachhaltigkeit (id_kriterium → "Nachhaltigkeit")
    const [vBase, setVBase] = useState("");
    const [vTarget, setVTarget] = useState("");
    const [vNow, setVNow] = useState("");

    // Kosten (id_kriterium → "Kosten")
    const [kosten, setKosten] = useState("");
    const [deltaS, setDeltaS] = useState("");

    // UI
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // ── Berechnungen ──────────────────────────────────────────
    // Sauberkeit: Checkboxen → 0–1
    const sauberkeit = sicherheit.filter(Boolean).length / sicherheit.length;

    // Soziale Akzeptanz: Slider → 0–1
    const akzeptanzWert = sozialeAkzeptanz / 100;

    // Sicherheit: Risikomatrix → Gesamtwert (Summe aller Produkte)
    const risikoGesamtwert = risikoMatrix.reduce(
        (sum, r) => sum + r.wahrscheinlichkeit * r.effekt,
        0
    );

    // Nachhaltigkeit: Rm
    const vBaseN = parseFloat(vBase) || 0;
    const vTargetN = parseFloat(vTarget) || 0;
    const vNowN = parseFloat(vNow) || 0;
    const Rm = berechneResilienz(vBaseN, vTargetN, vNowN);

    // Kosten: Re
    const kostenN = parseFloat(kosten) || 0;
    const deltaSN = parseFloat(deltaS) || 0;
    const Re = berechneEffizienz(kostenN, deltaSN);

    // ── Helpers ───────────────────────────────────────────────
    const toggleSicherheit = (i) =>
        setSicherheit((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    const updateRisiko = (i, field, value) =>
        setRisikoMatrix((prev) =>
            prev.map((r, idx) => (idx === i ? { ...r, [field]: Number(value) } : r))
        );

    const getRmLabel = (rm) => {
        if (vTarget === "" || vBase === "" || vTargetN === vBaseN) return "—";
        if (rm >= 1) return "Voll stabil";
        if (rm >= 0.5) return "Bedingt nachhaltig";
        return "Nicht nachhaltig";
    };

    const resetForm = () => {
        setName("");
        setBeschreibung("");
        setSicherheit(Array(8).fill(false));
        setSozialeAkzeptanz(50);
        setRisikoMatrix(RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 })));
        setVBase(""); setVTarget(""); setVNow("");
        setKosten(""); setDeltaS("");
    };

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFeedback(null);

        // FormData bauen — Keys müssen exakt den Kriterien-Namen entsprechen
        // die createMeasureWithRating per formData.get(critName) liest
        const formData = new FormData();
        formData.set("name", name);
        formData.set("beschreibung", beschreibung);
        formData.set("status", "offen");

        // Kriterien-Werte — Namen exakt wie in requiredCriteria in der Action
        formData.set("Sauberkeit",       sauberkeit.toFixed(4));
        formData.set("Sicherheit",       String(risikoGesamtwert));
        formData.set("Soziale Akzeptanz", akzeptanzWert.toFixed(4));
        formData.set("Nachhaltigkeit",   Rm.toFixed(4));
        formData.set("Kosten",           Re.toFixed(6));

        const result = await createMeasureWithRating(formData);

        if (result?.success) {
            setFeedback({ type: "success", message: "Maßnahme erfolgreich gespeichert!" });
            resetForm();
        } else {
            setFeedback({ type: "error", message: result?.error ?? "Unbekannter Fehler." });
        }

        setSaving(false);
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <h1>Neue Maßnahme erstellen</h1>

            {feedback && (
                <div style={{
                    padding: "10px 16px",
                    marginBottom: 16,
                    border: "1px solid",
                    borderColor: feedback.type === "success" ? "green" : "red",
                    color: feedback.type === "success" ? "green" : "red",
                    background: feedback.type === "success" ? "#f0fff0" : "#fff0f0",
                }}>
                    {feedback.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* ── Name ── */}
                <section>
                    <h2>Name</h2>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Maßnahmenname"
                        required
                        style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                    />
                </section>

                {/* ── Beschreibung ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>Beschreibung</h2>
                    <textarea
                        value={beschreibung}
                        onChange={(e) => setBeschreibung(e.target.value)}
                        placeholder="Beschreibung der Maßnahme"
                        rows={4}
                        style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                    />
                </section>

                {/* ── Sauberkeit — Checkboxen → 0–1 ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>
                        Sauberkeit{" "}
                        <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
              ({sicherheit.filter(Boolean).length}/{sicherheit.length} ={" "}
                            {(sauberkeit * 100).toFixed(0)}% → {sauberkeit.toFixed(2)})
            </span>
                    </h2>
                    {SICHERHEITSFRAGEN.map((frage, i) => (
                        <label
                            key={i}
                            style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}
                        >
                            <input
                                type="checkbox"
                                checked={sicherheit[i]}
                                onChange={() => toggleSicherheit(i)}
                            />
                            {frage}
                        </label>
                    ))}
                </section>

                {/* ── Soziale Akzeptanz — Slider → 0–1 ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>
                        Soziale Akzeptanz{" "}
                        <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
              ({sozialeAkzeptanz}% → {akzeptanzWert.toFixed(2)})
            </span>
                    </h2>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={sozialeAkzeptanz}
                        onChange={(e) => setSozialeAkzeptanz(Number(e.target.value))}
                        style={{ width: "100%" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                </section>

                {/* ── Sicherheit — Risikomatrix → Gesamtwert ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>
                        Sicherheit / Risikomatrix{" "}
                        <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
              (Gesamtwert: {risikoGesamtwert})
            </span>
                    </h2>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr>
                            <th style={thStyle}>Risiko</th>
                            <th style={thStyle}>Wahrscheinlichkeit (1–5)</th>
                            <th style={thStyle}>Effekt (1–5)</th>
                            <th style={thStyle}>Produkt</th>
                        </tr>
                        </thead>
                        <tbody>
                        {RISIKEN.map((risiko, i) => {
                            const row = risikoMatrix[i];
                            const produkt = row.wahrscheinlichkeit * row.effekt;
                            return (
                                <tr key={i}>
                                    <td style={tdStyle}>{risiko}</td>
                                    <td style={tdStyle}>
                                        <select
                                            value={row.wahrscheinlichkeit}
                                            onChange={(e) => updateRisiko(i, "wahrscheinlichkeit", e.target.value)}
                                        >
                                            {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={row.effekt}
                                            onChange={(e) => updateRisiko(i, "effekt", e.target.value)}
                                        >
                                            {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold" }}>
                                        {produkt}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                        <tfoot>
                        <tr>
                            <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>Gesamt:</td>
                            <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold" }}>{risikoGesamtwert}</td>
                        </tr>
                        </tfoot>
                    </table>
                </section>

                {/* ── Nachhaltigkeit — Rm ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>Nachhaltigkeit (Resilienz R<sub>m</sub>)</h2>
                    <p style={{ margin: "0 0 8px", fontSize: "0.9em", color: "#555" }}>
                        R<sub>m</sub> = (V<sub>now</sub> − V<sub>base</sub>) / (V<sub>target</sub> − V<sub>base</sub>)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>base</sub> — vor Maßnahme</div>
                            <input
                                type="number"
                                value={vBase}
                                onChange={(e) => setVBase(e.target.value)}
                                placeholder="z.B. 30"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>target</sub> — direkt nach Umsetzung</div>
                            <input
                                type="number"
                                value={vTarget}
                                onChange={(e) => setVTarget(e.target.value)}
                                placeholder="z.B. 80"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>now</sub> — nach Kontrollintervall</div>
                            <input
                                type="number"
                                value={vNow}
                                onChange={(e) => setVNow(e.target.value)}
                                placeholder="z.B. 65"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                    </div>
                    {vTarget !== "" && vBase !== "" && (
                        <p style={{ marginTop: 8 }}>
                            <strong>R<sub>m</sub> = {Rm.toFixed(4)}</strong>{" "}
                            — {getRmLabel(Rm)}
                            {vTargetN === vBaseN && (
                                <span style={{ color: "red" }}> ⚠ Zielwert = Basiswert (wird als 0 gespeichert)</span>
                            )}
                        </p>
                    )}
                </section>

                {/* ── Kosten — Re ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>Kosten &amp; Effizienz (R<sub>e</sub>)</h2>
                    <p style={{ margin: "0 0 8px", fontSize: "0.9em", color: "#555" }}>
                        R<sub>e</sub> = ΔS / C — höher = effizienter (mehr Verbesserung pro €)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label>
                            <div style={{ marginBottom: 4 }}>Gesamtkosten C (€)</div>
                            <input
                                type="number"
                                min={0}
                                value={kosten}
                                onChange={(e) => setKosten(e.target.value)}
                                placeholder="z.B. 500"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>Score-Delta ΔS (Verbesserung in Prozentpunkten)</div>
                            <input
                                type="number"
                                value={deltaS}
                                onChange={(e) => setDeltaS(e.target.value)}
                                placeholder="z.B. 20"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                    </div>
                    {kosten !== "" && deltaS !== "" && (
                        <p style={{ marginTop: 8 }}>
                            <strong>R<sub>e</sub> = {Re.toFixed(6)}</strong>
                            {kostenN === 0 && (
                                <span style={{ color: "red" }}> ⚠ Kosten = 0 (wird als 0 gespeichert)</span>
                            )}
                        </p>
                    )}
                </section>

                {/* ── Submit ── */}
                <section style={{ marginTop: 32, marginBottom: 40 }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: "10px 24px",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Wird gespeichert…" : "Maßnahme speichern"}
                    </button>
                </section>

            </form>
        </main>
    );
}

const thStyle = {
    border: "1px solid #ccc",
    padding: "6px 10px",
    background: "#f5f5f5",
    textAlign: "left",
};

const tdStyle = {
    border: "1px solid #ccc",
    padding: "6px 10px",
};