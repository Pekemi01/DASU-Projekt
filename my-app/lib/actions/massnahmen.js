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
/**
 * @description Erstellt eine Maßnahme und stellt sicher, dass Standard-Kriterien existieren.
 * Speichert anschließend die Bewertungen für alle definierten Kriterien.
 */
export async function createMeasureWithRating(formData) {
  const measureName = formData.get('name');
  const measureDescription = formData.get('beschreibung');
  const measureStatus = formData.get('status');

  // Validierung: Nur der Name ist zwingend erforderlich
  if (!measureName) {
    return { error: 'Der Name der Maßnahme ist ein Pflichtfeld.' };
  }

  // Liste der erforderlichen Kriterien
  const requiredCriteria = [
    'Sauberkeit',
    'Nachhaltigkeit',
    'Sicherheit',
    'Kosten',
    'Soziale Akzeptanz'
  ];

  const databaseClient = await databasePool.connect();

  try {
    await databaseClient.query('BEGIN');

    // 1. Kriterien sicherstellen (Upsert-Logik)
    // Wir holen uns die IDs aller benötigten Kriterien
    const criteriaIds = {};
    for (const criterionName of requiredCriteria) {
      const criterionUpsertResult = await databaseClient.query(
          `INSERT INTO kriterien (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
          [criterionName]
      );
      // Hinweis: Damit ON CONFLICT funktioniert, muss ein UNIQUE Constraint auf kriterien(name) liegen!
      // Falls kein Constraint existiert, nutzen wir eine SELECT/INSERT Logik:
      /*
      let ergebnis = await databaseClient.query('SELECT id FROM kriterien WHERE name = $1', [criterionName]);
      if (ergebnis.rows.length === 0) {
        ergebnis = await databaseClient.query('INSERT INTO kriterien (name) VALUES ($1) RETURNING id', [criterionName]);
      }
      criteriaIds[criterionName] = ergebnis.rows[0].id;
      */
      criteriaIds[criterionName] = criterionUpsertResult.rows[0].id;
    }

    // 2. Maßnahme erstellen
    const insertMeasureQuery = `
      INSERT INTO massnahmen (name, beschreibung, status)
      VALUES ($1, $2, $3)
        RETURNING id
    `;
    const insertedMeasureResult = await databaseClient.query(insertMeasureQuery, [
      measureName,
      measureDescription,
      measureStatus,
    ]);
    const createdMeasureId = insertedMeasureResult.rows[0].id;

    // 3. Bewertungen speichern
    const insertRatingQuery = `
      INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung)
      VALUES ($1, $2, $3)
    `;

    for (const criterionName of requiredCriteria) {
      const rawValue = formData.get(criterionName); // Erwartet Input-Namen wie "Sauberkeit" im Formular

      // Nur speichern, wenn ein Wert vorhanden ist (Float oder leer ist okay laut Anforderung)
      if (rawValue !== null && rawValue !== '') {
        const ratingValue = parseFloat(rawValue.replace(',', '.')); // Erlaubt Komma-Eingabe

        await databaseClient.query(insertRatingQuery, [
          createdMeasureId,
          criteriaIds[criterionName],
          isNaN(ratingValue) ? null : ratingValue,
        ]);
      }
    }

    await databaseClient.query('COMMIT');
    revalidatePath('/massnahmen');

    return { success: true };
  } catch (databaseError) {
    await databaseClient.query('ROLLBACK');
    console.error('Fehler in createMeasureWithRating:', databaseError.message);
    return { error: `Datenbankfehler: ${databaseError.message}` };
  } finally {
    databaseClient.release();
  }
}

/**
 * @author Milenko
 * @param measureId
 * @param formData
 * @returns {Promise<{success: boolean}|{error: *}>}
 */
/**
 * @description Speichert erstmalig die Bewertungen einer Maßnahme (INSERT only).
 * Zusätzlich werden die Rohwerte der Eingabefelder als JSON in massnahmen.raw_inputs abgelegt,
 * damit das Edit-Formular später vollständig vorausgefüllt werden kann.
 * @param {number} measureId - ID der zu bewertenden Maßnahme
 * @param {FormData} formData - Berechnete Kriterien-Scores + raw_inputs (JSON-String)
 */
export async function updateMeasureRatings(measureId, formData) {
  const databaseClient = await databasePool.connect();
  try {
    await databaseClient.query('BEGIN');

    const requiredCriteria = ['Sauberkeit', 'Nachhaltigkeit', 'Sicherheit', 'Kosten', 'Soziale Akzeptanz'];

    for (const criterionName of requiredCriteria) {
      const rawValue = formData.get(criterionName);
      if (rawValue === null || rawValue === '') continue;

      const ratingValue = parseFloat(rawValue.replace(',', '.'));

      await databaseClient.query(`
                INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung)
                VALUES ($1, (SELECT id FROM kriterien WHERE name = $2), $3)
            `, [measureId, criterionName, isNaN(ratingValue) ? null : ratingValue]);
    }

    const rawInputsJson = formData.get('raw_inputs');
    if (rawInputsJson) {
      await databaseClient.query(
        `UPDATE massnahmen SET raw_inputs = $1 WHERE id = $2`,
        [rawInputsJson, measureId]
      );
    }

    await databaseClient.query('COMMIT');
    revalidatePath('/measure');
    return { success: true };
  } catch (e) {
    await databaseClient.query('ROLLBACK');
    return { error: e.message };
  } finally {
    databaseClient.release();
  }
}
/**
 * @description Aktualisiert bestehende Bewertungen einer Maßnahme (UPSERT).
 * Überschreibt vorhandene Einträge in massnahmen_bewertungen und aktualisiert
 * gleichzeitig die gespeicherten Rohwerte in massnahmen.raw_inputs.
 * @param {number} measureId - ID der zu bearbeitenden Maßnahme
 * @param {FormData} formData - Berechnete Kriterien-Scores + raw_inputs (JSON-String)
 */
export async function editMeasureRatings(measureId, formData) {
  const databaseClient = await databasePool.connect();
  try {
    await databaseClient.query('BEGIN');

    const requiredCriteria = ['Sauberkeit', 'Nachhaltigkeit', 'Sicherheit', 'Kosten', 'Soziale Akzeptanz'];

    for (const criterionName of requiredCriteria) {
      const rawValue = formData.get(criterionName);
      if (rawValue === null || rawValue === '') continue;

      const ratingValue = parseFloat(rawValue.replace(',', '.'));

      await databaseClient.query(`
                INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung)
                VALUES ($1, (SELECT id FROM kriterien WHERE name = $2), $3)
                ON CONFLICT (id_massnahme, id_kriterium)
                DO UPDATE SET bewertung = EXCLUDED.bewertung
            `, [measureId, criterionName, isNaN(ratingValue) ? null : ratingValue]);
    }

    const rawInputsJson = formData.get('raw_inputs');
    if (rawInputsJson) {
      await databaseClient.query(
        `UPDATE massnahmen SET raw_inputs = $1 WHERE id = $2`,
        [rawInputsJson, measureId]
      );
    }

    await databaseClient.query('COMMIT');
    revalidatePath('/measure');
    return { success: true };
  } catch (e) {
    await databaseClient.query('ROLLBACK');
    return { error: e.message };
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

/**@author Milenko
 * @description Liefert alle Maßnahmen
 * @returns {Promise<*[]|string|HTMLCollectionOf<HTMLTableRowElement>|number|SQLResultSetRowList>}
 */
  export async function getAllMeasures() {
  const databaseClient = await databasePool.connect();
  try {
    const result = await databaseClient.query(
        `SELECT id AS massnahme_id, name AS massnahme_name, beschreibung, status
             FROM massnahmen
             ORDER BY id DESC`
    );
    return result.rows;
  } catch (e) {
    console.error(e);
    return [];
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

