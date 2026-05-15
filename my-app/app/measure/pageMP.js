/**
 * @author Milenko Pekez
 * @description Seite zum Erstellen einer neuen Maßnahme inklusive Bewertungsformular.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMeasureWithRating } from "@/lib/actions/massnahmen.js";

// Liste der Sicherheitsfragen für die Sauberkeits-Checkliste
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

// Liste der Risiken für die Risikomatrix
const RISIKEN = [
    "Stolpern / Stürzen",
    "Elektrische Gefährdung",
    "Chemische Exposition",
    "Ergonomische Belastung",
    "Psychische Belastung",
];

/**
 * @description Berechnet den Resilienzwert Rm einer Maßnahme.
 * Formel: Rm = (aktuellerWert - basiswert) / (zielwert - basiswert)
 */
function berechneResilienz(basiswert, zielwert, aktuellerWert) {
    if (zielwert === basiswert) return 0;
    return (aktuellerWert - basiswert) / (zielwert - basiswert);
}

/**
 * @description Berechnet den Effizienzwert Re einer Maßnahme.
 * Formel: Re = scoreDelta / gesamtkosten — höher bedeutet effizienter (mehr Verbesserung pro €)
 */
function berechneEffizienz(gesamtkosten, scoreDelta) {
    if (gesamtkosten === 0) return 0;
    return scoreDelta / gesamtkosten;
}

/**
 * @description Hauptkomponente der Maßnahmen-Seite.
 * Verwaltet alle Formularfelder und leitet nach erfolgreichem Speichern zur Gewichtungsseite weiter.
 */
export default function MaßnahmePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");

    // Sauberkeit (id_kriterium → "Sauberkeit")
    const [sauberkeitsCheckboxen, setSauberkeitsCheckboxen] = useState(Array(8).fill(false));

    // Soziale Akzeptanz (id_kriterium → "Soziale Akzeptanz")
    const [sozialeAkzeptanz, setSozialeAkzeptanz] = useState(50);

    // Sicherheit / Risikomatrix (id_kriterium → "Sicherheit")
    const [risikoMatrix, setRisikoMatrix] = useState(
        RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 }))
    );

    // Nachhaltigkeit (id_kriterium → "Nachhaltigkeit")
    const [basiswert, setBasiswert] = useState("");
    const [zielwert, setZielwert] = useState("");
    const [aktuellerWert, setAktuellerWert] = useState("");

    // Kosten (id_kriterium → "Kosten")
    const [kosten, setKosten] = useState("");
    const [scoreDelta, setScoreDelta] = useState("");

    // UI
    const [wirdGespeichert, setWirdGespeichert] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // ── Berechnungen ──────────────────────────────────────────
    // Sauberkeit: Checkboxen → 0–1
    const sauberkeit = sauberkeitsCheckboxen.filter(Boolean).length / sauberkeitsCheckboxen.length;

    // Soziale Akzeptanz: Slider → 0–1
    const akzeptanzWert = sozialeAkzeptanz / 100;

    // Sicherheit: Risikomatrix → Gesamtwert (Summe aller Produkte)
    const risikoGesamtwert = risikoMatrix.reduce(
        (sum, r) => sum + r.wahrscheinlichkeit * r.effekt,
        0
    );

    // Nachhaltigkeit: Rm
    const basiswertZahl = parseFloat(basiswert) || 0;
    const zielwertZahl = parseFloat(zielwert) || 0;
    const aktuellerWertZahl = parseFloat(aktuellerWert) || 0;
    const resilienzWert = berechneResilienz(basiswertZahl, zielwertZahl, aktuellerWertZahl);

    // Kosten: Re
    const kostenZahl = parseFloat(kosten) || 0;
    const scoreDeltaZahl = parseFloat(scoreDelta) || 0;
    const effizienzWert = berechneEffizienz(kostenZahl, scoreDeltaZahl);

    // ── Helpers ───────────────────────────────────────────────

    /**
     * @description Schaltet den Zustand einer Sauberkeits-Checkbox um.
     */
    const toggleSauberkeitsCheckbox = (checkboxIndex) =>
        setSauberkeitsCheckboxen((prev) => prev.map((v, idx) => (idx === checkboxIndex ? !v : v)));

    /**
     * @description Aktualisiert einen Wert (Wahrscheinlichkeit oder Effekt) in der Risikomatrix.
     */
    const aktualisiereRisikoeintrag = (risikoIndex, feldName, neuerWert) =>
        setRisikoMatrix((prev) =>
            prev.map((r, idx) => (idx === risikoIndex ? { ...r, [feldName]: Number(neuerWert) } : r))
        );

    /**
     * @description Gibt eine textuelle Einschätzung des Resilienzwertes zurück.
     */
    const erstelleResilienzBeschriftung = (resilienz) => {
        if (zielwert === "" || basiswert === "" || zielwertZahl === basiswertZahl) return "—";
        if (resilienz >= 1) return "Voll stabil";
        if (resilienz >= 0.5) return "Bedingt nachhaltig";
        return "Nicht nachhaltig";
    };

    /**
     * @description Setzt alle Formularfelder auf ihre Ausgangswerte zurück.
     */
    const setzteFormularZurueck = () => {
        setName("");
        setBeschreibung("");
        setSauberkeitsCheckboxen(Array(8).fill(false));
        setSozialeAkzeptanz(50);
        setRisikoMatrix(RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 })));
        setBasiswert(""); setZielwert(""); setAktuellerWert("");
        setKosten(""); setScoreDelta("");
    };

    // ── Submit ────────────────────────────────────────────────

    /**
     * @description Verarbeitet das Absenden des Formulars.
     * Baut FormData auf, ruft die Server Action auf und leitet bei Erfolg zur Gewichtungsseite weiter.
     * Bei Fehler wird eine Rückmeldung im UI angezeigt.
     */
    const handleFormularAbsenden = async (e) => {
        e.preventDefault();
        setWirdGespeichert(true);
        setFeedback(null);

        // FormData bauen — Keys müssen exakt den Kriterien-Namen entsprechen
        // die createMeasureWithRating per formData.get(critName) liest
        const formData = new FormData();
        formData.set("name", name);                  // Pflichtfeld: Name der Maßnahme
        formData.set("beschreibung", beschreibung);  // Optional: Freitext-Beschreibung
        formData.set("status", "offen");             // Fester Startstatus für neue Maßnahmen

        // Kriterien-Werte — Namen exakt wie in requiredCriteria in der Action
        formData.set("Sauberkeit",        sauberkeit.toFixed(4));          // Anteil erfüllter Checkboxen (0–1)
        formData.set("Sicherheit",        String(risikoGesamtwert));       // Summe aller Wahrscheinlichkeit × Effekt aus der Risikomatrix
        formData.set("Soziale Akzeptanz", akzeptanzWert.toFixed(4));       // Slider-Wert umgerechnet auf 0–1
        formData.set("Nachhaltigkeit",    resilienzWert.toFixed(4));       // Resilienzwert Rm = (aktuellerWert - basiswert) / (zielwert - basiswert)
        formData.set("Kosten",            effizienzWert.toFixed(6));       // Effizienzwert Re = scoreDelta / gesamtkosten

        const serverErgebnis = await createMeasureWithRating(formData);

        if (serverErgebnis?.success) {
            // Maßnahmendaten für die Gewichtungsseite zwischenspeichern
            sessionStorage.setItem("massnahme_daten", JSON.stringify({
                name,
                Sauberkeit: sauberkeit.toFixed(4),
                Sicherheit: String(risikoGesamtwert),
                "Soziale Akzeptanz": akzeptanzWert.toFixed(4),
                Nachhaltigkeit: resilienzWert.toFixed(4),
                Kosten: effizienzWert.toFixed(6),
            }));
            router.push("/weighting");
            return;
        } else {
            setFeedback({ type: "error", message: serverErgebnis?.error ?? "Unbekannter Fehler." });
        }

        setWirdGespeichert(false);
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

            <form onSubmit={handleFormularAbsenden}>

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
              ({sauberkeitsCheckboxen.filter(Boolean).length}/{sauberkeitsCheckboxen.length} ={" "}
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
                                checked={sauberkeitsCheckboxen[i]}
                                onChange={() => toggleSauberkeitsCheckbox(i)}
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
                            const risikoEintrag = risikoMatrix[i];
                            const produkt = risikoEintrag.wahrscheinlichkeit * risikoEintrag.effekt;
                            return (
                                <tr key={i}>
                                    <td style={tdStyle}>{risiko}</td>
                                    <td style={tdStyle}>
                                        <select
                                            value={risikoEintrag.wahrscheinlichkeit}
                                            onChange={(e) => aktualisiereRisikoeintrag(i, "wahrscheinlichkeit", e.target.value)}
                                        >
                                            {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </td>
                                    <td style={tdStyle}>
                                        <select
                                            value={risikoEintrag.effekt}
                                            onChange={(e) => aktualisiereRisikoeintrag(i, "effekt", e.target.value)}
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
                                value={basiswert}
                                onChange={(e) => setBasiswert(e.target.value)}
                                placeholder="z.B. 30"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>target</sub> — direkt nach Umsetzung</div>
                            <input
                                type="number"
                                value={zielwert}
                                onChange={(e) => setZielwert(e.target.value)}
                                placeholder="z.B. 80"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>now</sub> — nach Kontrollintervall</div>
                            <input
                                type="number"
                                value={aktuellerWert}
                                onChange={(e) => setAktuellerWert(e.target.value)}
                                placeholder="z.B. 65"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                    </div>
                    {zielwert !== "" && basiswert !== "" && (
                        <p style={{ marginTop: 8 }}>
                            <strong>R<sub>m</sub> = {resilienzWert.toFixed(4)}</strong>{" "}
                            — {erstelleResilienzBeschriftung(resilienzWert)}
                            {zielwertZahl === basiswertZahl && (
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
                                value={scoreDelta}
                                onChange={(e) => setScoreDelta(e.target.value)}
                                placeholder="z.B. 20"
                                style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
                            />
                        </label>
                    </div>
                    {kosten !== "" && scoreDelta !== "" && (
                        <p style={{ marginTop: 8 }}>
                            <strong>R<sub>e</sub> = {effizienzWert.toFixed(6)}</strong>
                            {kostenZahl === 0 && (
                                <span style={{ color: "red" }}> ⚠ Kosten = 0 (wird als 0 gespeichert)</span>
                            )}
                        </p>
                    )}
                </section>

                {/* ── Submit ── */}
                <section style={{ marginTop: 32, marginBottom: 40 }}>
                    <button
                        type="submit"
                        disabled={wirdGespeichert}
                        style={{
                            padding: "10px 24px",
                            cursor: wirdGespeichert ? "not-allowed" : "pointer",
                            opacity: wirdGespeichert ? 0.6 : 1,
                        }}
                    >
                        {wirdGespeichert ? "Wird gespeichert…" : "Maßnahme speichern"}
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
