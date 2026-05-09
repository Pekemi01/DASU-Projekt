/**
 * @author Milenko Pekez
 * @description
 */

import { Pool } from 'pg';


// Verhindert, dass in der Entwicklung bei jedem Speichern ein neuer Pool erstellt wird
if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

const db = global.pool;

export default db;