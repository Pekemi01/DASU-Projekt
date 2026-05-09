/**
 * @Author: Milenko Pekez
 * @Description: Aktionen zur Kommunikation und verwaltung der Datenbank.
 */

'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';


/**
 * @description Erstellt eine Maßnahme und eine Bewertung atomar (Transaktion).
 */
export async function createMassnahmeMitBewertung(formData) {
  const name = formData.get('name');
  const beschreibung = formData.get('beschreibung');
  const status = formData.get('status');
  const id_kriterium = formData.get('id_kriterium');
  const bewertung = formData.get('bewertung');

  if (!name || !id_kriterium || !bewertung) {
    return { error: "Pflichtfelder fehlen (Name, Kriterium, Bewertung)." };
  }

  const client = await databasePool.connect();
  try {
    await client.query('BEGIN');

    // Korrektur: Komma gesetzt und Klammer bei RETURNING id entfernt
    const massnahmenResult = await client.query(
        'INSERT INTO massnahmen (name, beschreibung, status) VALUES ($1, $2, $3) RETURNING id',
        [name, beschreibung, status]
    );

    const massnahmenId = massnahmenResult.rows[0].id;

    await client.query(
        'INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung) VALUES ($1, $2, $3)',
        [massnahmenId, id_kriterium, bewertung]
    );

    await client.query('COMMIT');
    revalidatePath('/massnahmen');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("DB-Fehler:", error.message);
    return { error: "Fehler beim Erstellen: " + error.message };
  } finally {
    client.release();
  }
}

/**
 * @description Nutzt CASCADE DELETE der Datenbank aus.
 */
export async function deleteMassnahme(id) {
  const client = await databasePool.connect();
  try {
    await client.query('DELETE FROM massnahmen WHERE id = $1', [id]);
    revalidatePath('/massnahmen');
    return { success: true };
  } catch (error) {
    console.error("Lösch-Fehler:", error.message);
    return { error: "Löschen fehlgeschlagen." };
  } finally {
    client.release();
  }
}

/**

 * @description Holt alle Maßnahmen, die bereits mindestens eine Bewertung haben,
 *              inklusive der Bewertungsdetails.
 */

export async function getAllMassnahmenWithRatings() {
  const client = await databasePool.connect();
  try {
    const query = `
      SELECT 
        m.id AS massnahme_id,
        m.name AS massnahme_name,
        m.beschreibung,
        m.status,
        mb.id_kriterium,
        mb.bewertung,
        k.name AS kriterien_name
      FROM massnahmen m
      INNER JOIN massnahmen_bewertungen mb ON m.id = mb.id_massnahme
      INNER JOIN kriterien k ON mb.id_kriterium = k.id
      ORDER BY m.id DESC;
    `;

    const result = await client.query(query);

    return result.rows;

  } catch (error) {
    console.error("Datenbank-Fehler beim Laden der Bewertungen:", error.message);
    return [];
  } finally {
    client.release();
  }
}


/**
 * @description Update-Funktion mit Daten-Extraktion
 */
export async function updateMassnahme(id, formData) {
  const name = formData.get('name');
  const beschreibung = formData.get('beschreibung');
  const status = formData.get('status');

  const client = await databasePool.connect();
  try {
    const query = `UPDATE massnahmen SET name = $1, beschreibung = $2, status = $3 WHERE id = $4`;
    await client.query(query, [name, beschreibung, status, id]);

    revalidatePath('/massnahmen');
    return { success: true };
  } catch (error) {
    console.error("Update-Fehler:", error.message);
    return { error: "Update fehlgeschlagen." };
  } finally {
    client.release();
  }
}

/**
 * @description Holt von der Maßnahme eine ID
 */
export async function getMassnahmeById(id) {
  const client = await databasePool.connect();
  try {
    const query = `
      SELECT
        m.*,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'kriterium_id', k.id,
                    'kriterium_name', k.name,
                    'bewertung', mb.bewertung
                )
            ) FILTER (WHERE mb.id_kriterium IS NOT NULL),
            '[]'
        ) AS bewertungen
      FROM massnahmen m
             LEFT JOIN massnahmen_bewertungen mb ON m.id = mb.id_massnahme
             LEFT JOIN kriterien k ON mb.id_kriterium = k.id
      WHERE m.id = $1
      GROUP BY m.id;
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  } catch (error) {
    console.error("Datenbank-Fehler beim Abrufen der Maßnahme:", error.message);
    return null;
  } finally {
    client.release();
  }
}
/**
 * Sucht Maßnahmen anhand des Namens (Teilsuche) inkl. aller Bewertungen.
 */
export async function getMassnahmenByName(name) {
  const client = await databasePool.connect();
  try {
    const query = `
      SELECT 
        m.*, 
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'kriterium_id', k.id,
              'kriterium_name', k.name,
              'bewertung', mb.bewertung
            )
          ) FILTER (WHERE mb.id_kriterium IS NOT NULL), 
          '[]'
        ) AS bewertungen
      FROM massnahmen m
      LEFT JOIN massnahmen_bewertungen mb ON m.id = mb.id_massnahme
      LEFT JOIN kriterien k ON mb.id_kriterium = k.id
      WHERE m.name ILIKE $1
      GROUP BY m.id
      ORDER BY m.name ASC;
    `;

    // Das %-Zeichen vor und nach dem Namen erlaubt die Teilsuche
    const result = await client.query(query, [`%${name}%`]);

    return result.rows;
  } catch (error) {
    console.error("Fehler bei der Namenssuche:", error.message);
    return [];
  } finally {
    client.release();
  }
}