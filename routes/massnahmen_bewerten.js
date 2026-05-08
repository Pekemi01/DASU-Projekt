/**
 * @author Milenko
 * @description CRUD Operationen für die Tabelle massnahmen_bewerten
 */


//Create 
router.post('/', async (request, response) => {
  const { measureId, criterionId, ratingValue } = request.body;
  try {
    const insertResult = await databasePool.query(
      'INSERT INTO massnahmen_bewertungen (id_massnahme, id_kriterium, bewertung) VALUES ($1, $2, $3) RETURNING *',
      [measureId, criterionId, ratingValue]
    );
    response.status(201).json(insertResult.rows[0]);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});

//READ
router.get('/massnahme/:measureId', async (request, response) => {
  const { measureId } = request.params;
  try {
    const queryResult = await databasePool.query(
      `SELECT massnahmen_bewertungen.*, kriterien.name as criterionName 
       FROM massnahmen_bewertungen 
       JOIN kriterien ON massnahmen_bewertungen.id_kriterium = kriterien.id
       WHERE massnahmen_bewertungen.id_massnahme = $1`,
      [measureId]
    );
    response.json(queryResult.rows);
  } catch (exception) {
    response.status(500).json({ error: exception.message });
  }
});