/**
 * @author Milenko
 * @description Server Actions für Maßnahmen-Bewertungen (CRUD)
 */

'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * @description Erstellt eine neue Bewertung für eine bestehende Maßnahme.
 */
export async function createRating(
    measureId,
    criterionId,
    ratingValue
) {
  try {
    const insertRatingQuery = `
      INSERT INTO massnahmen_bewertungen (
        id_massnahme,
        id_kriterium,
        bewertung
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const queryResult = await databasePool.query(
        insertRatingQuery,
        [
          measureId,
          criterionId,
          ratingValue,
        ]
    );

    revalidatePath('/massnahmen');

    return {
      success: true,
      data: queryResult.rows[0],
    };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Erstellen der Bewertung:',
        databaseError.message
    );

    return {
      error: 'Bewertung konnte nicht erstellt werden.',
    };
  }
}

/**
 * @description Holt alle Bewertungen für eine bestimmte Maßnahme.
 */
export async function getRatingsByMeasureId(measureId) {
  try {
    const selectRatingsByMeasureQuery = `
      SELECT
        mb.*,
        k.name AS criterion_name
      FROM massnahmen_bewertungen mb
      JOIN kriterien k
        ON mb.id_kriterium = k.id
      WHERE mb.id_massnahme = $1
    `;

    const queryResult = await databasePool.query(
        selectRatingsByMeasureQuery,
        [measureId]
    );

    return queryResult.rows;
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Laden der Bewertungen:',
        databaseError.message
    );

    return [];
  }
}

/**
 * @description Aktualisiert die Bewertung
 * eines bestimmten Kriteriums einer Maßnahme.
 *
 * Beispiel:
 * Maßnahme 1 erhält für Kriterium 3 eine neue Bewertung.
 */
export async function updateRatingByMeasureAndCriterion(
    measureId,
    criterionId,
    updatedRatingValue
) {
  try {
    const updateRatingQuery = `
      UPDATE massnahmen_bewertungen
      SET bewertung = $1
      WHERE id_massnahme = $2
        AND id_kriterium = $3
      RETURNING *
    `;

    const queryResult = await databasePool.query(
        updateRatingQuery,
        [
          updatedRatingValue,
          measureId,
          criterionId,
        ]
    );

    if (queryResult.rowCount === 0) {
      return {
        error: 'Bewertung wurde nicht gefunden.',
      };
    }

    revalidatePath('/massnahmen');

    return {
      success: true,
      data: queryResult.rows[0],
    };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Aktualisieren der Bewertung:',
        databaseError.message
    );

    return {
      error: 'Aktualisierung der Bewertung fehlgeschlagen.',
    };
  }
}

/**
 * @description Löscht eine bestimmte Bewertung
 * anhand von Maßnahme und Kriterium.
 */
export async function deleteRatingByMeasureAndCriterion(
    measureId,
    criterionId
) {
  try {
    const deleteRatingQuery = `
      DELETE FROM massnahmen_bewertungen
      WHERE id_massnahme = $1
        AND id_kriterium = $2
    `;

    await databasePool.query(
        deleteRatingQuery,
        [
          measureId,
          criterionId,
        ]
    );

    revalidatePath('/massnahmen');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Löschen der Bewertung:',
        databaseError.message
    );

    return {
      error: 'Löschen der Bewertung fehlgeschlagen.',
    };
  }
}