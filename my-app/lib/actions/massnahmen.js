/**
 * @author Milenko Pekez
 * @description Aktionen zur Kommunikation und Verwaltung der Datenbank.
 */

'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * @description Erstellt eine Maßnahme inklusive Bewertung atomar innerhalb einer Transaktion.
 */
export async function createMeasureWithRating(formData) {
  const measureName = formData.get('name');
  const measureDescription = formData.get('beschreibung');
  const measureStatus = formData.get('status');
  const criterionId = formData.get('id_kriterium');
  const ratingValue = formData.get('bewertung');

  if (!measureName || !criterionId || !ratingValue) {
    return {
      error: 'Pflichtfelder fehlen (Name, Kriterium, Bewertung).',
    };
  }

  const databaseClient = await databasePool.connect();

  try {
    await databaseClient.query('BEGIN');

    const insertMeasureQuery = `
      INSERT INTO massnahmen (name, beschreibung, status)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const insertedMeasureResult = await databaseClient.query(
        insertMeasureQuery,
        [measureName, measureDescription, measureStatus]
    );

    const createdMeasureId = insertedMeasureResult.rows[0].id;

    const insertRatingQuery = `
      INSERT INTO massnahmen_bewertungen (
        id_massnahme,
        id_kriterium,
        bewertung
      )
      VALUES ($1, $2, $3)
    `;

    await databaseClient.query(insertRatingQuery, [
      createdMeasureId,
      criterionId,
      ratingValue,
    ]);

    await databaseClient.query('COMMIT');

    revalidatePath('/massnahmen');

    return { success: true };
  } catch (databaseError) {
    await databaseClient.query('ROLLBACK');

    console.error(
        'Datenbankfehler beim Erstellen der Maßnahme:',
        databaseError.message
    );

    return {
      error: `Fehler beim Erstellen der Maßnahme: ${databaseError.message}`,
    };
  } finally {
    databaseClient.release();
  }
}

/**
 * @description Löscht eine Maßnahme.
 * Die zugehörigen Bewertungen werden durch CASCADE DELETE automatisch entfernt.
 */
export async function deleteMeasureById(measureId) {
  const databaseClient = await databasePool.connect();

  try {
    const deleteMeasureQuery = `
      DELETE FROM massnahmen
      WHERE id = $1
    `;

    await databaseClient.query(deleteMeasureQuery, [measureId]);

    revalidatePath('/massnahmen');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Fehler beim Löschen der Maßnahme:',
        databaseError.message
    );

    return {
      error: 'Löschen der Maßnahme fehlgeschlagen.',
    };
  } finally {
    databaseClient.release();
  }
}

/**
 * @description Holt alle Maßnahmen inklusive ihrer Bewertungen.
 * Es werden nur Maßnahmen geladen, die mindestens eine Bewertung besitzen.
 */
export async function getAllMeasuresWithRatings() {
  const databaseClient = await databasePool.connect();

  try {
    const selectMeasuresWithRatingsQuery = `
      SELECT
        m.id AS massnahme_id,
        m.name AS massnahme_name,
        m.beschreibung,
        m.status,
        mb.id_kriterium,
        mb.bewertung,
        k.name AS kriterien_name
      FROM massnahmen m
             INNER JOIN massnahmen_bewertungen mb
                        ON m.id = mb.id_massnahme
             INNER JOIN kriterien k
                        ON mb.id_kriterium = k.id
      ORDER BY m.id DESC;
    `;

    const queryResult = await databaseClient.query(
        selectMeasuresWithRatingsQuery
    );

    return queryResult.rows;
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Laden der Bewertungen:',
        databaseError.message
    );

    return [];
  } finally {
    databaseClient.release();
  }
}

/**
 * @description Aktualisiert die Stammdaten einer Maßnahme.
 */
export async function updateMeasureById(measureId, formData) {
  const measureName = formData.get('name');
  const measureDescription = formData.get('beschreibung');
  const measureStatus = formData.get('status');

  const databaseClient = await databasePool.connect();

  try {
    const updateMeasureQuery = `
      UPDATE massnahmen
      SET
        name = $1,
        beschreibung = $2,
        status = $3
      WHERE id = $4
    `;

    await databaseClient.query(updateMeasureQuery, [
      measureName,
      measureDescription,
      measureStatus,
      measureId,
    ]);

    revalidatePath('/massnahmen');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Fehler beim Aktualisieren der Maßnahme:',
        databaseError.message
    );

    return {
      error: 'Aktualisierung der Maßnahme fehlgeschlagen.',
    };
  } finally {
    databaseClient.release();
  }
}

/**
 * @description Lädt eine Maßnahme anhand ihrer ID inklusive aller Bewertungen.
 */
export async function getMeasureById(measureId) {
  const databaseClient = await databasePool.connect();

  try {
    const selectMeasureByIdQuery = `
      SELECT
        m.*,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'criterionId', k.id,
                    'criterionName', k.name,
                    'ratingValue', mb.bewertung
                )
            ) FILTER (WHERE mb.id_kriterium IS NOT NULL),
            '[]'
        ) AS ratings
      FROM massnahmen m
             LEFT JOIN massnahmen_bewertungen mb
                       ON m.id = mb.id_massnahme
             LEFT JOIN kriterien k
                       ON mb.id_kriterium = k.id
      WHERE m.id = $1
      GROUP BY m.id;
    `;

    const queryResult = await databaseClient.query(
        selectMeasureByIdQuery,
        [measureId]
    );

    if (queryResult.rows.length === 0) {
      return null;
    }

    return queryResult.rows[0];
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Abrufen der Maßnahme:',
        databaseError.message
    );

    return null;
  } finally {
    databaseClient.release();
  }
}

/**
 * @description Sucht Maßnahmen anhand des Namens (Teilsuche)
 * inklusive aller Bewertungen.
 */
export async function searchMeasuresByName(measureName) {
  const databaseClient = await databasePool.connect();

  try {
    const searchMeasuresQuery = `
      SELECT
        m.*,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'criterionId', k.id,
                    'criterionName', k.name,
                    'ratingValue', mb.bewertung
                )
            ) FILTER (WHERE mb.id_kriterium IS NOT NULL),
            '[]'
        ) AS ratings
      FROM massnahmen m
             LEFT JOIN massnahmen_bewertungen mb
                       ON m.id = mb.id_massnahme
             LEFT JOIN kriterien k
                       ON mb.id_kriterium = k.id
      WHERE m.name ILIKE $1
      GROUP BY m.id
      ORDER BY m.name ASC;
    `;

    const searchPattern = `%${measureName}%`;

    const queryResult = await databaseClient.query(
        searchMeasuresQuery,
        [searchPattern]
    );

    return queryResult.rows;
  } catch (databaseError) {
    console.error(
        'Fehler bei der Suche nach Maßnahmen:',
        databaseError.message
    );

    return [];
  } finally {
    databaseClient.release();
  }
}

