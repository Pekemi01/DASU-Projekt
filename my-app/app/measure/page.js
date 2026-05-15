"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMeasureWithRating } from "@/lib/actions/massnahmen.js";
import Link from 'next/link';

export default function MaßnahmePage() {
    const router = useRouter(); 
    
    // --- Icon-Operations ---

    const editMeasure = (idx) => {
        // Name der Maßnahme neu setzen
        router.push(`/measure/edit/${idx}`);
    }

    const scoreMeasure = (idx) => {
        // Maßnahme (neu) bewerten
        router.push(`/measure/score/${idx}`);
    }

    const deleteMeasure = (idx) => {
        // Maßnahme löschen
    }

    // --- Daten ---
    const measures = [
    { id: 1, name: "Maßnahme 1", beschreibung: "Test 1" },
    { id: 2, name: "Maßnahme 2", beschreibung: "Test 2" },
    { id: 3, name: "Maßnahme 3", beschreibung: "Test 3" }
    ];


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
       <div className="app-container">
            {/* Homescreen Button*/}
            <Link href="/home">
                <button>← Zurück zur Homepage</button>
            </Link>
        
            <h1>Maßnahmen</h1>
            <p
            style={{
                fontSize: 18
            }}>
                Hier können Sie neue Maßnahmen anlegen und bereits angelegte verwalten.
            </p>

            <div className="list">
                {measures.map((eintrag, idx) => (
                    <div className="row" key={idx}>
                        <div className="info">
                            <span className="name">
                                {eintrag.name}
                            </span>

                            <span className="beschreibung">
                                {eintrag.beschreibung}
                            </span>
                        </div>

                        <div className="icons">
                            <button
                                onClick={() => editMeasure(idx)}
                                title="Bearbeiten"
                                style={{
                                    border: "none",
                                    background: "none",
                                    fontSize: 18
                                }}
                                >
                                    ✏️
                            </button>

                            <button
                                onClick={() => scoreMeasure(idx)}
                                title="Bewerten"
                                style={{
                                    border: "none",
                                    background: "none",
                                    fontSize: 18
                                }}
                                >
                                    ⭐
                            </button>

                            <button
                                onClick={() => deleteMeasure(idx)}
                                title="Löschen"
                                style={{
                                    border: "none",
                                    background: "none",
                                    fontSize: 18
                                }}
                                >
                                    🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Link href="/measure/add">
                <button
                    title="Hinzufügen"
                    style={{
                        border: "none",
                        background: "none",
                        paddingTop: 20,
                        fontSize: 18
                    }}
                    >
                        ➕
                </button>
            </Link>
        </div>
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
