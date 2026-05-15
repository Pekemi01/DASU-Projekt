'use client'

import Link from 'next/link';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMeasure(idx) {

    const [feedback, setFeedback] = useState(null);
    const router = useRouter();
    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
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


    return (
        <div className="app-container">
            {/* Back Button*/}
            <Link href="/measure">
                <button>← Zurück zur Maßnahmen Übersicht</button>
            </Link>

            <h1 className="card-title">➕ Maßnahme hinzufügen</h1>

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
            </form>
        </div>    
    )
}