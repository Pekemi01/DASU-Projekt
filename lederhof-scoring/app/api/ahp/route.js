import { NextResponse } from "next/server";
import { berechneAHPGewichte, pruefeKonsistenz } from "@/lib/scoring-engine";

/**
 * POST /api/ahp
 * Echtzeit-AHP-Berechnung für die Eingabemaske
 * 
 * Body: { matrix: number[][] }
 * Returns: { gewichte, konsistenz }
 */
export async function POST(request) {
  try {
    const { matrix } = await request.json();

    if (!matrix || matrix.length < 2) {
      return NextResponse.json(
        { error: "Matrix ist erforderlich" },
        { status: 400 }
      );
    }

    const gewichte = berechneAHPGewichte(matrix);
    const konsistenz = pruefeKonsistenz(matrix, gewichte);

    return NextResponse.json({
      gewichte: gewichte.map((g) => Number(g.toFixed(4))),
      prozente: gewichte.map((g) => Number((g * 100).toFixed(1))),
      konsistenz,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Berechnungsfehler: " + error.message },
      { status: 500 }
    );
  }
}
