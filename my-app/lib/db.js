/**
 * @author Milenko Pekez
 * @description
 */

import { Pool } from 'pg';


// Verhindert, dass in der Entwicklung bei jedem Speichern ein neuer Pool erstellt wird
let db;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optionale Optimierung für Prototypen:
    max: 10, // Maximal 10 gleichzeitige Verbindungen
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}
pool = global.pool;

export default pool;