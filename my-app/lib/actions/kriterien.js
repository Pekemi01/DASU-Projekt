/**
 * @author Milenko
 * @description Server Actions für Kriterien (CRUD)
 */
'use server';

import databasePool from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Erstellt ein neues Kriterium.
 * @param {FormData} formData
 */
export async function createKriterium(formData) {
  const name = formData.get('name');
  const beschreibung = formData.get('beschreibung');

  if (!name) return { error: "Name ist erforderlich" };

  try {
    await databasePool.query(
        'INSERT INTO kriterien (name, beschreibung) VALUES ($1, $2)',
        [name, beschreibung]
    );
    revalidatePath('/criteria');
    return { success: true };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Fehler beim Erstellen." };
  }
}

/**
 * Holt ein Kriterium anhand seiner ID.
 * @param {number} id
 */
export async function getKriteriumById(id) {
  try {
    const result = await databasePool.query(
        'SELECT * FROM kriterien WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return null;
  }
}

/**
 * Holt Kriterien anhand des Namens (Teilsuche).
 * @param {string} name
 */
export async function getKriterienByName(name) {
  try {
    const result = await databasePool.query(
        'SELECT * FROM kriterien WHERE name ILIKE $1',
        [`%${name}%`] // ILIKE ist Case-Insensitive (Groß/Kleinschreibung egal)
    );
    return result.rows;
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return [];
  }
}

/**
 * Aktualisiert ein bestehendes Kriterium.
 * @param {number} id
 * @param {FormData} formData
 */
export async function updateKriterium(id, formData) {
  const name = formData.get('name');
  const beschreibung = formData.get('beschreibung');

  try {
    const result = await databasePool.query(
        'UPDATE kriterien SET name = $1, beschreibung = $2 WHERE id = $3 RETURNING *',
        [name, beschreibung, id]
    );

    if (result.rowCount === 0) return { error: "Kriterium nicht gefunden." };

    revalidatePath('/criteria');
    return { success: true };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Update fehlgeschlagen." };
  }
}

/**
 * Löscht ein Kriterium.
 * @param {number} id
 */
export async function deleteKriterium(id) {
  try {
    await databasePool.query('DELETE FROM kriterien WHERE id = $1', [id]);
    revalidatePath('/criteria');
    return { success: true };
  } catch (error) {
    console.error("DB-Fehler:", error.message);
    return { error: "Löschen fehlgeschlagen." };
  }
}