'use client'

import Link from 'next/link';
import { useState } from "react";

import { createMeasureWithRating } from "lib/actions/massnahmen";
import {getAllMeasureswithRatings} from "lib/actions/massnahmen";

export default function AddMeasure(idx) {
    const [feedback, setFeedback] = useState(null);
    const [wirdGespeichert, setWirdGespeichert] = useState(false);
    const [name, setName] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    
    /**
     * @description Verarbeitet das Absenden des Formulars.
     * Baut FormData auf, ruft die Server Action auf und leitet bei Erfolg zur Gewichtungsseite weiter.
     * Bei Fehler wird eine Rückmeldung im UI angezeigt.
     */
    const handleFormularAbsenden = async (e) => {
        e.preventDefault();
        setWirdGespeichert(true);
        setFeedback(null);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("beschreibung", beschreibung);
        formData.set("status", "offen");

        const serverErgebnis = await createMeasureWithRating(formData);

        if (serverErgebnis?.success) {
            setFeedback({ type: "success", message: "Maßnahme erfolgreich gespeichert!" });
            setName("");           // Felder leeren
            setBeschreibung("");
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
                <button type="submit" disabled={wirdGespeichert} style={{ marginTop: 24 }}>
                    {wirdGespeichert ? "Wird gespeichert..." : "Speichern"}
                </button>
            </form>
        </div>    
    )
}