/**
 * @author Milenko
 * @description Server Actions für Kriterien (CRUD)
 */

'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * @description Erstellt ein neues Kriterium.
 * @param {FormData} formData
 */
export async function createCriterion(formData) {
  const criterionName = formData.get('name');
  const criterionDescription = formData.get('beschreibung');

  if (!criterionName) {
    return {
      error: 'Der Name des Kriteriums ist erforderlich.',
    };
  }

  try {
    const insertCriterionQuery = `
      INSERT INTO kriterien (name, beschreibung)
      VALUES ($1, $2)
    `;

    await databasePool.query(insertCriterionQuery, [
      criterionName,
      criterionDescription,
    ]);

    revalidatePath('/criteria');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Erstellen des Kriteriums:',
        databaseError.message
    );

    return {
      error: 'Fehler beim Erstellen des Kriteriums.',
    };
  }
}

/**
 * @description Holt ein Kriterium anhand seiner ID.
 * @param {number} criterionId
 */
export async function getCriterionById(criterionId) {
  try {
    const selectCriterionByIdQuery = `
      SELECT *
      FROM kriterien
      WHERE id = $1
    `;

    const queryResult = await databasePool.query(
        selectCriterionByIdQuery,
        [criterionId]
    );

    return queryResult.rows[0] || null;
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Laden des Kriteriums:',
        databaseError.message
    );

    return null;
  }
}

/**
 * @description Sucht Kriterien anhand des Namens (Teilsuche).
 * @param {string} criterionName
 */
export async function searchCriteriaByName(criterionName) {
  try {
    const searchCriteriaQuery = `
      SELECT *
      FROM kriterien
      WHERE name ILIKE $1
    `;

    const searchPattern = `%${criterionName}%`;

    const queryResult = await databasePool.query(
        searchCriteriaQuery,
        [searchPattern]
    );

    return queryResult.rows;
  } catch (databaseError) {
    console.error(
        'Datenbankfehler bei der Suche nach Kriterien:',
        databaseError.message
    );

    return [];
  }
}

/**
 * @description Aktualisiert ein bestehendes Kriterium.
 * @param {number} criterionId
 * @param {FormData} formData
 */
export async function updateCriterionById(criterionId, formData) {
  const criterionName = formData.get('name');
  const criterionDescription = formData.get('beschreibung');

  try {
    const updateCriterionQuery = `
      UPDATE kriterien
      SET
        name = $1,
        beschreibung = $2
      WHERE id = $3
      RETURNING *
    `;

    const queryResult = await databasePool.query(
        updateCriterionQuery,
        [
          criterionName,
          criterionDescription,
          criterionId,
        ]
    );

    if (queryResult.rowCount === 0) {
      return {
        error: 'Kriterium wurde nicht gefunden.',
      };
    }

    revalidatePath('/criteria');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Aktualisieren des Kriteriums:',
        databaseError.message
    );

    return {
      error: 'Aktualisierung des Kriteriums fehlgeschlagen.',
    };
  }
}

/**
 * @description Löscht ein Kriterium anhand seiner ID.
 * @param {number} criterionId
 */
export async function deleteCriterionById(criterionId) {
  try {
    const deleteCriterionQuery = `
      DELETE FROM kriterien
      WHERE id = $1
    `;

    await databasePool.query(deleteCriterionQuery, [criterionId]);

    revalidatePath('/criteria');

    return { success: true };
  } catch (databaseError) {
    console.error(
        'Datenbankfehler beim Löschen des Kriteriums:',
        databaseError.message
    );

    return {
      error: 'Löschen des Kriteriums fehlgeschlagen.',
    };
  }
}