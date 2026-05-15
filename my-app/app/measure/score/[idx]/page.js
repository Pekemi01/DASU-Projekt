'use client'

import Link from 'next/link';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScoreMeasure(idx) {
    // const mit Daten zu Maßnahme mit Index idx

    return (
        <div className='app-container'>
             {/* Back Button*/}
            <Link href="/measure">
                <button>← Zurück zur Maßnahmen Übersicht</button>
            </Link>

            <h1 className="card-title">⭐ Maßnahme bewerten - 'Titel Maßnahme'</h1>

        </div>
    )
}