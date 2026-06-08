"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllMeasures, deleteMeasureById } from "@/lib/actions/massnahmen.js";
import Link from 'next/link';

export default function MeasurePage() {
    const router = useRouter();
    const [massnahmen, setMassnahmen] = useState([]);
    const [zuLoeschen, setZuLoeschen] = useState(null); // ID der Maßnahme die gelöscht werden soll

    useEffect(() => {
        getAllMeasures().then((data) => setMassnahmen(data));
    }, []);

    const editMeasure = (id) => router.push(`/measure/edit/${id}`);
    const scoreMeasure = (id) => router.push(`/measure/score/${id}`);

    const deleteMeasure = async () => {
        await deleteMeasureById(zuLoeschen);
        setMassnahmen((prev) => prev.filter((m) => m.massnahme_id !== zuLoeschen));
        setZuLoeschen(null);
    };

    return (
        <div className="app-container">
            <Link href="/home">
                <button>← Zurück zur Homepage</button>
            </Link>

            <h1>Maßnahmen</h1>
            <p style={{ fontSize: 18 }}>
                Hier können Sie neue Maßnahmen anlegen und bereits angelegte verwalten.
            </p>

            {/* ── Popup ── */}
            {zuLoeschen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div style={{
                        background: "white", padding: 32, borderRadius: 8,
                        textAlign: "center", minWidth: 300
                    }}>
                        <p style={{ fontSize: 18, marginBottom: 24 }}>
                            Bist du sicher, dass du diese Maßnahme löschen möchtest?
                        </p>
                        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                            <button onClick={deleteMeasure} style={{
                                background: "red", color: "white",
                                border: "none", padding: "8px 24px", borderRadius: 4, cursor: "pointer"
                            }}>
                                Ja, löschen
                            </button>
                            <button onClick={() => setZuLoeschen(null)} style={{
                                background: "#ccc", border: "none",
                                padding: "8px 24px", borderRadius: 4, cursor: "pointer"
                            }}>
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="list">
                {massnahmen.length === 0 && <p>Keine Maßnahmen vorhanden.</p>}

                {massnahmen.map((eintrag) => (
                    <div className="row" key={eintrag.massnahme_id}>
                        <div className="info">
                            <span className="name">{eintrag.massnahme_name}</span>
                            <span className="beschreibung">{eintrag.beschreibung}</span>
                        </div>

                        <div className="icons">
                            <button onClick={() => editMeasure(eintrag.massnahme_id)}
                                    title="Bearbeiten" style={{ border: "none", background: "none", fontSize: 18 }}>
                                ✏️
                            </button>
                            <button onClick={() => scoreMeasure(eintrag.massnahme_id)}
                                    title="Bewerten" style={{ border: "none", background: "none", fontSize: 18 }}>
                                ⭐
                            </button>
                            <button onClick={() => setZuLoeschen(eintrag.massnahme_id)}
                                    title="Löschen" style={{ border: "none", background: "none", fontSize: 18 }}>
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Link href="/measure/add">
                <button title="Hinzufügen"
                        style={{ border: "none", background: "none", paddingTop: 20, fontSize: 18 }}>
                    ➕
                </button>
            </Link>
        </div>
    );
}