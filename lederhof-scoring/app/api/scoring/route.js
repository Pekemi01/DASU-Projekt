import { NextResponse } from "next/server";
import {
  berechneAHPGewichte,
  pruefeKonsistenz,
  berechneTOPSIS,
  KRITERIEN,
} from "@/lib/scoring-engine";

/**
 * POST /api/scoring
 * 
 * Erwartet JSON Body:
 * {
 *   ahpMatrix: number[][],       // 5x5 paarweise Vergleichsmatrix
 *   massnahmen: {
 *     name: string,
 *     werte: number[]            // [Sauberkeit%, RisikoScore, Akzeptanz%, Resilienz, Effizienz]
 *   }[]
 * }
 * 
 * Gibt zurück:
 * {
 *   gewichte: { name: string, gewicht: number }[],
 *   konsistenz: { lambdaMax, CI, CR, konsistent },
 *   ranking: { name, dPlus, dMinus, score, rang }[]
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { ahpMatrix, massnahmen } = body;

    // Validierung
    if (!ahpMatrix || !massnahmen || massnahmen.length === 0) {
      return NextResponse.json(
        { error: "ahpMatrix und massnahmen sind erforderlich" },
        { status: 400 }
      );
    }

    const n = KRITERIEN.length;

    // AHP-Matrix validieren
    if (ahpMatrix.length !== n || ahpMatrix.some((row) => row.length !== n)) {
      return NextResponse.json(
        { error: `ahpMatrix muss ${n}x${n} sein` },
        { status: 400 }
      );
    }

    // Massnahmen-Werte validieren
    if (massnahmen.some((m) => !m.werte || m.werte.length !== n)) {
      return NextResponse.json(
        { error: `Jede Maßnahme braucht ${n} Werte` },
        { status: 400 }
      );
    }

    // 1. AHP: Gewichte berechnen
    const gewichteRaw = berechneAHPGewichte(ahpMatrix);
    const konsistenz = pruefeKonsistenz(ahpMatrix, gewichteRaw);

    const gewichte = KRITERIEN.map((k, i) => ({
      id: k.id,
      name: k.name,
      gewicht: Number(gewichteRaw[i].toFixed(4)),
      prozent: Number((gewichteRaw[i] * 100).toFixed(1)),
    }));

    // 2. TOPSIS: Ranking berechnen
    const bewertungsMatrix = massnahmen.map((m) => m.werte);
    const namen = massnahmen.map((m) => m.name);
    const ranking = berechneTOPSIS(bewertungsMatrix, gewichteRaw, KRITERIEN, namen);

    return NextResponse.json({
      gewichte,
      konsistenz,
      ranking,
    });
  } catch (error) {
    console.error("Scoring-Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler: " + error.message },
      { status: 500 }
    );
  }
}
