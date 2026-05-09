/**
 * @author Milenko
 * @description Server Actions für massnahmen_bewertungen (CRUD)
 */
'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Erstellt eine neue Bewertung für eine bestehende Maßnahme.
 * @param {number} measureId
 * @param {number} criterionId
 * @param {number} ratingValue
 */
export async function createBewertung(measureId, criterionId, ratingValue) {
  try {
    const result = await databasePool.query(
        'INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung) VALUES ($1, $2, $3) RETURNING *',
        [measureId, criterionId, ratingValue]
    );
    revalidatePath('/massnahmen'); // Pfad anpassen, wo die Liste angezeigt wird
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Bewertung konnte nicht erstellt werden." };
  }
}

/**
 * Holt alle Bewertungen für eine bestimmte Maßnahme.
 * @param {number} measureId
 */
export async function getBewertungenByMassnahme(measureId) {
  try {
    const queryResult = await databasePool.query(
        `SELECT mb.*, k.name as kriterien_name 
       FROM massnahmen_bewertungen mb
       JOIN kriterien k ON mb.id_kriterium = k.id
       WHERE mb.id_massnahme = $1`,
        [measureId]
    );
    return queryResult.rows;
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return [];
  }
}

/**
 * ÄNDERT die Bewertung für ein spezifisches Kriterium einer Maßnahme.
 * Beispiel: Maßnahme 1 bekommt für Kriterium 3 eine neue Note.
 *
 * @param {number} measureId - ID der Maßnahme
 * @param {number} criterionId - ID des Kriteriums
 * @param {number} newRating - Der neue Wert (1-5)
 */
export async function updateBewertung(measureId, criterionId, newRating) {
  try {
    const result = await databasePool.query(
        `UPDATE massnahmen_bewertungen 
       SET bewertung = $1 
       WHERE id_massnahme = $2 AND id_kriterium = $3 
       RETURNING *`,
        [newRating, measureId, criterionId]
    );

    if (result.rowCount === 0) {
      return { error: "Bewertung nicht gefunden." };
    }

    revalidatePath('/massnahmen');
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Update fehlgeschlagen." };
  }
}

/**
 * Löscht eine spezifische Bewertung.
 */
export async function deleteBewertung(measureId, criterionId) {
  try {
    await databasePool.query(
        'DELETE FROM massnahmen_bewertungen WHERE id_massnahme = $1 AND id_kriterium = $2',
        [measureId, criterionId]
    );
    revalidatePath('/massnahmen');
    return { success: true };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Löschen fehlgeschlagen." };
  }
}