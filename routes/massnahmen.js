/**
 * @author Milenko Pekez
 * @description Service Klasse zu CRUD operationen
 */


const express = require('express');
const router = express.Router();
const databasePool = require('../db/pool')

//CRUD-Operationen
//CREATE
router.post('/', async (request, response) => {
  const { measureName, measureDescription, measureStatus } = request.body;
  try {
    const insertResult = await databasePool.query(
      'INSERT INTO massnahmen (name, beschreibung, status) VALUES ($1, $2, $3) RETURNING *',
      [measureName, measureDescription, measureStatus]
    );
    response.status(201).json(insertResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//READ (Alle Massnahmen)
router.get('/', async (request, response) => {
  try {
    const queryResult = await databasePool.query('SELECT * FROM massnahmen');
    response.json(queryResult.rows);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//READ eine Massnahme holen
router.get('/:measureId', async (request, response) => {
  const { measureId } = request.params;
  try {
    const queryResult = await databasePool.query(
      'SELECT * FROM massnahmen WHERE id = $1',
      [measureId]
    );
    // Prüfen ob die Maßnahme existiert
    if (queryResult.rows.length === 0) {
      return response.status(404).json({ error: 'Maßnahme nicht gefunden' });
    }
    response.json(queryResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//Update 
router.put('/:measureId', async (request, response) => {
  const { measureId } = request.params;
  const { measureName, measureDescription, measureStatus } = request.body;
  try {
    const updateResult = await databasePool.query(
      'UPDATE massnahmen SET name=$1, beschreibung=$2, status=$3 WHERE id=$4 RETURNING *',
      [measureName, measureDescription, measureStatus, measureId]
    );
    if (updateResult.rows.length === 0) {
      return response.status(404).json({ error: 'Maßnahme nicht gefunden' });
    }
    response.json(updateResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//Delete 
router.delete('/:measureId', async (request, response) => {
  const { measureId } = request.params;
  try {
    const deleteResult = await databasePool.query(
      'DELETE FROM massnahmen WHERE id=$1 RETURNING *',
      [measureId]
    );
    if (deleteResult.rows.length === 0) {
      return response.status(404).json({ error: 'Maßnahme nicht gefunden' });
    }
    response.json({ message: 'Maßnahme gelöscht', maßnahme: deleteResult.rows[0] });
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});
module.exports = router;