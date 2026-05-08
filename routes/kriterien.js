/** 
 * @author Milenko
 * @description Crud operationen für Kirterien
*/

const express = require('express');
const router = express.Router();
const databasePool = require('../db/pool');

//Create
router.post('/', async (request, response) => {
  const { criterionName, criterionDescription } = request.body;
  try {
    const insertResult = await databasePool.query(
      'INSERT INTO kriterien (name, beschreibung) VALUES ($1, $2) RETURNING *',
      [criterionName, criterionDescription]
    );
    response.status(201).json(insertResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//READ (alle)
router.get('/', async (request, response) => {
  try {
    const queryResult = await databasePool.query('SELECT * FROM kriterien');
    response.json(queryResult.rows);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//Read (einzeln)
router.get('/:criterionId', async (request, response) => {
  const { criterionId } = request.params;
  try {
    const queryResult = await databasePool.query(
      'SELECT * FROM kriterien WHERE id = $1',
      [criterionId]
    );
    if (queryResult.rows.length === 0) {
      return response.status(404).json({ error: 'Kriterium nicht gefunden' });
    }
    response.json(queryResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//Update
router.put('/:criterionId', async (request, response) => {
  const { criterionId } = request.params;
  const { criterionName, criterionDescription } = request.body;
  try {
    const updateResult = await databasePool.query(
      'UPDATE kriterien SET name=$1, beschreibung=$2 WHERE id=$3 RETURNING *',
      [criterionName, criterionDescription, criterionId]
    );
    if (updateResult.rows.length === 0) {
      return response.status(404).json({ error: 'Kriterium nicht gefunden' });
    }
    response.json(updateResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//Delete
router.delete('/:criterionId', async (request, response) => {
  const { criterionId } = request.params;
  try {
    const deleteResult = await databasePool.query(
      'DELETE FROM kriterien WHERE id=$1 RETURNING *',
      [criterionId]
    );
    if (deleteResult.rows.length === 0) {
      return response.status(404).json({ error: 'Kriterium nicht gefunden' });
    }
    response.json({ message: 'Kriterium gelöscht', kriterium: deleteResult.rows[0] });
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

module.exports = router;