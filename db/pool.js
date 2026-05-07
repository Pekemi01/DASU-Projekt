const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.connect((err) => {
  if (err) {
    console.error('❌ DB Verbindung fehlgeschlagen:', err.message);
  } else {
    console.log('✅ PostgreSQL verbunden!');
  }
});

module.exports = pool;

