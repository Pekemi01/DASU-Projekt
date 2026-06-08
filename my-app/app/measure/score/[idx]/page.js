"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMeasureById, updateMeasureRatings } from "@/lib/actions/massnahmen.js";
import Link from "next/link";

const SICHERHEITSFRAGEN = [
    "Es sind keine Spritzen auf dem Boden",
    "Es gibt keine Glasscherben",
    "Es liegt kein Papier, Plastik, oder Holz etc. auf dem Platz",
    "Es liegen keine Zigarettenkippen auf dem Boden",
    "Es liegen keine Flaschen auf dem Boden",
    "Es sind keine Exkremente auf dem Platz",
    "Die Mülleimer sind nicht mehr als 75 % voll",
    "Es sind keine Essensreste auf dem Platz",
    "Es befindet sich kein Graffiti auf dem Platz, auf dem es nicht erwünscht ist",
    "Es ist frei von klebrigen Substanzen/Flecken",
    "Es würde nichts beschädigt",
];

const RISIKEN = [
    "Stolpern / Stürzen",
    "Elektrische Gefährdung",
    "Chemische Exposition",
    "Ergonomische Belastung",
    "Psychische Belastung",
];

function berechneResilienz(basiswert, zielwert, aktuellerWert) {
    if (zielwert === basiswert) return 0;
    return (aktuellerWert - basiswert) / (zielwert - basiswert);
}

function berechneEffizienz(gesamtkosten, scoreDelta) {
    if (gesamtkosten === 0) return 0;
    return scoreDelta / gesamtkosten;
}

export default function ScorePage() {
    const router = useRouter();
    const { idx: id } = useParams();

    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [wirdGespeichert, setWirdGespeichert] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [geladen, setGeladen] = useState(false);

    // Scoring States — gleich wie in deiner bestehenden Seite
    const [sauberkeitsCheckboxen, setSauberkeitsCheckboxen] = useState(Array(SICHERHEITSFRAGEN.length).fill(false));
    const [sozialeAkzeptanz, setSozialeAkzeptanz] = useState(50);
    const [risikoMatrix, setRisikoMatrix] = useState(
        RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 }))
    );
    const [basiswert, setBasiswert] = useState("");
    const [zielwert, setZielwert] = useState("");
    const [aktuellerWert, setAktuellerWert] = useState("");
    const [kosten, setKosten] = useState("");
    const [scoreDelta, setScoreDelta] = useState("");

    // ── Maßnahme laden und Felder vorausfüllen ──
    useEffect(() => {
        // Alle Felder zurücksetzen bevor neue Maßnahme geladen wird
        setGeladen(false);
        setSauberkeitsCheckboxen(Array(SICHERHEITSFRAGEN.length).fill(false));
        setSozialeAkzeptanz(50);
        setRisikoMatrix(RISIKEN.map(() => ({ wahrscheinlichkeit: 1, effekt: 1 })));
        setBasiswert(""); setZielwert(""); setAktuellerWert("");
        setKosten(""); setScoreDelta("");

        getMeasureById(id).then((data) => {
            if (!data) return;

            // Wenn bereits Bewertungen existieren → zur Edit-Seite weiterleiten
            if (data.ratings?.length > 0) {
                router.replace(`/measure/edit/${id}`);
                return;
            }

            setName(data.name);
            setBeschreibung(data.beschreibung ?? "");

            // Gespeicherte Bewertungen in UI-Felder zurückrechnen
            data.ratings?.forEach((r) => {
                const val = parseFloat(r.ratingValue);
                if (r.criterionName === "Sauberkeit") {
                    const anzahl = Math.round(val * SICHERHEITSFRAGEN.length);
                    setSauberkeitsCheckboxen(Array(SICHERHEITSFRAGEN.length).fill(false).map((_, i) => i < anzahl));
                }
                if (r.criterionName === "Soziale Akzeptanz") {
                    setSozialeAkzeptanz(Math.round(val * 100));
                }
            });

            setGeladen(true);
        });
    }, [id]);

    // Berechnungen
    const sauberkeit = sauberkeitsCheckboxen.filter(Boolean).length / sauberkeitsCheckboxen.length;
    const akzeptanzWert = sozialeAkzeptanz / 100;
    const risikoGesamtwert = risikoMatrix.reduce((sum, r) => sum + r.wahrscheinlichkeit * r.effekt, 0);
    const basiswertZahl = parseFloat(basiswert) || 0;
    const zielwertZahl = parseFloat(zielwert) || 0;
    const aktuellerWertZahl = parseFloat(aktuellerWert) || 0;
    const resilienzWert = berechneResilienz(basiswertZahl, zielwertZahl, aktuellerWertZahl);
    const kostenZahl = parseFloat(kosten) || 0;
    const scoreDeltaZahl = parseFloat(scoreDelta) || 0;
    const effizienzWert = berechneEffizienz(kostenZahl, scoreDeltaZahl);

    const toggleSauberkeitsCheckbox = (i) =>
        setSauberkeitsCheckboxen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    const aktualisiereRisikoeintrag = (i, feld, val) =>
        setRisikoMatrix((prev) =>
            prev.map((r, idx) => (idx === i ? { ...r, [feld]: Number(val) } : r))
        );

    const erstelleResilienzBeschriftung = (r) => {
        if (zielwert === "" || basiswert === "" || zielwertZahl === basiswertZahl) return "—";
        if (r >= 1) return "Voll stabil";
        if (r >= 0.5) return "Bedingt nachhaltig";
        return "Nicht nachhaltig";
    };

    const handleFormularAbsenden = async (e) => {
        e.preventDefault();
        setWirdGespeichert(true);
        setFeedback(null);

        const formData = new FormData();
        formData.set("Sauberkeit",        sauberkeit.toFixed(4));
        formData.set("Sicherheit",        String(risikoGesamtwert));
        formData.set("Soziale Akzeptanz", akzeptanzWert.toFixed(4));
        formData.set("Nachhaltigkeit",    resilienzWert.toFixed(4));
        formData.set("Kosten",            effizienzWert.toFixed(6));
        formData.set("raw_inputs", JSON.stringify({
            sauberkeitsCheckboxen,
            sozialeAkzeptanz,
            risikoMatrix,
            basiswert,
            zielwert,
            aktuellerWert,
            kosten,
            scoreDelta,
        }));

        const result = await updateMeasureRatings(id, formData);

        if (result?.success) {
            router.push("/measure");
        } else {
            setFeedback({ type: "error", message: result?.error ?? "Unbekannter Fehler." });
            setWirdGespeichert(false);
        }
    };

    if (!geladen) return <p>Lädt...</p>;

    return (
        <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
            <Link href="/measure">
                <button>← Zurück zur Maßnahmen Übersicht</button>
            </Link>

            <h1>⭐ Maßnahme bewerten: {name}</h1>
            <p style={{ color: "#555" }}>{beschreibung}</p>

            {feedback && (
                <div style={{
                    padding: "10px 16px", marginBottom: 16, border: "1px solid",
                    borderColor: "red", color: "red", background: "#fff0f0"
                }}>
                    {feedback.message}
                </div>
            )}

            <form onSubmit={handleFormularAbsenden}>

                {/* ── Sauberkeit ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>
                        Sauberkeit{" "}
                        <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
                            ({sauberkeitsCheckboxen.filter(Boolean).length}/{sauberkeitsCheckboxen.length} ={" "}
                            {(sauberkeit * 100).toFixed(0)}% → {sauberkeit.toFixed(2)})
                        </span>
                    </h2>
                    {SICHERHEITSFRAGEN.map((frage, i) => (
                        <label key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <input
                                type="checkbox"
                                checked={sauberkeitsCheckboxen[i]}
                                onChange={() => toggleSauberkeitsCheckbox(i)}
                            />
                            {frage}
                        </label>
                    ))}
                </section>

                {/* ── Soziale Akzeptanz ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>
                        Soziale Akzeptanz{" "}
                        <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
                            ({sozialeAkzeptanz}% → {akzeptanzWert.toFixed(2)})
                        </span>
                    </h2>
                    <input
                        type="range" min={0} max={100} value={sozialeAkzeptanz}
                        onChange={(e) => setSozialeAkzeptanz(Number(e.target.value))}
                        style={{ width: "100%" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                </section>

                {/* ── Sicherheit / Risikomatrix ── */}
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
                                const eintrag = risikoMatrix[i];
                                const produkt = eintrag.wahrscheinlichkeit * eintrag.effekt;
                                return (
                                    <tr key={i}>
                                        <td style={tdStyle}>{risiko}</td>
                                        <td style={tdStyle}>
                                            <select value={eintrag.wahrscheinlichkeit}
                                                onChange={(e) => aktualisiereRisikoeintrag(i, "wahrscheinlichkeit", e.target.value)}>
                                                {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </td>
                                        <td style={tdStyle}>
                                            <select value={eintrag.effekt}
                                                onChange={(e) => aktualisiereRisikoeintrag(i, "effekt", e.target.value)}>
                                                {[1,2,3,4,5].map((v) => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold" }}>{produkt}</td>
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

                {/* ── Nachhaltigkeit ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>Nachhaltigkeit (Resilienz R<sub>m</sub>)</h2>
                    <p style={{ margin: "0 0 8px", fontSize: "0.9em", color: "#555" }}>
                        R<sub>m</sub> = (V<sub>now</sub> − V<sub>base</sub>) / (V<sub>target</sub> − V<sub>base</sub>)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>base</sub> — vor Maßnahme</div>
                            <input type="number" value={basiswert} onChange={(e) => setBasiswert(e.target.value)}
                                placeholder="z.B. 30" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>target</sub> — direkt nach Umsetzung</div>
                            <input type="number" value={zielwert} onChange={(e) => setZielwert(e.target.value)}
                                placeholder="z.B. 80" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>V<sub>now</sub> — nach Kontrollintervall</div>
                            <input type="number" value={aktuellerWert} onChange={(e) => setAktuellerWert(e.target.value)}
                                placeholder="z.B. 65" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
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

                {/* ── Kosten & Effizienz ── */}
                <section style={{ marginTop: 24 }}>
                    <h2>Kosten &amp; Effizienz (R<sub>e</sub>)</h2>
                    <p style={{ margin: "0 0 8px", fontSize: "0.9em", color: "#555" }}>
                        R<sub>e</sub> = ΔS / C — höher = effizienter (mehr Verbesserung pro €)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label>
                            <div style={{ marginBottom: 4 }}>Gesamtkosten C (€)</div>
                            <input type="number" min={0} value={kosten} onChange={(e) => setKosten(e.target.value)}
                                placeholder="z.B. 500" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
                        </label>
                        <label>
                            <div style={{ marginBottom: 4 }}>Score-Delta ΔS (Verbesserung in Prozentpunkten)</div>
                            <input type="number" value={scoreDelta} onChange={(e) => setScoreDelta(e.target.value)}
                                placeholder="z.B. 20" style={{ width: "100%", padding: "6px", boxSizing: "border-box" }} />
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

                <section style={{ marginTop: 32, marginBottom: 40 }}>
                    <button type="submit" disabled={wirdGespeichert} style={{
                        padding: "10px 24px",
                        cursor: wirdGespeichert ? "not-allowed" : "pointer",
                        opacity: wirdGespeichert ? 0.6 : 1,
                    }}>
                        {wirdGespeichert ? "Wird gespeichert…" : "Bewertung speichern"}
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