
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let pool = null;
let sqlJsDb = null;
let SQL = null;
let dbType = 'mysql';

const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'club_management.sqlite');

function saveSqlJsDb() {
  if (sqlJsDb && dbType === 'sqlite') {
    try {
      const data = sqlJsDb.export();
      fs.writeFileSync(dbFilePath, Buffer.from(data));
    } catch (e) {
      console.error('[DB] Failed to save SQLite file:', e.message);
    }
  }
}

async function getDb() {
  if (pool || sqlJsDb) {
    return { query: executeQuery, type: dbType };
  }

  const dbName = process.env.DB_NAME || 'club_management';

  // Try MySQL / TiDB first.
  try {
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 3306,
      connectTimeout: 10000
    };

    // TiDB Cloud requires TLS. Keep local XAMPP connections
    // unencrypted unless DB_SSL is explicitly enabled.
    if (process.env.DB_SSL === 'true') {
      connectionConfig.ssl = {
        minVersion: 'TLSv1.2'
      };
    }

    // Connect directly to the existing database.
    pool = mysql.createPool({
      ...connectionConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Verify that the credentials and database are working.
    await pool.query('SELECT 1');

    dbType = 'mysql';
    console.log(`[DB] Connected to MySQL/TiDB database: ${dbName}`);

    return { query: executeQuery, type: dbType };
  } catch (mysqlErr) {
    if (pool) {
      try {
        await pool.end();
      } catch (_) {
        // Ignore cleanup errors.
      }
      pool = null;
    }

    // Do not silently fall back to SQLite in production.
    if (process.env.NODE_ENV === 'production') {
      console.error('[DB] Production database connection failed:', mysqlErr.message);
      throw mysqlErr;
    }

    console.warn('[DB] MySQL connection failed:', mysqlErr.message);
    console.log('[DB] Falling back to local SQLite mode.');

    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      sqlJsDb = new SQL.Database(fileBuffer);
    } else {
      sqlJsDb = new SQL.Database();
    }

    dbType = 'sqlite';

    return { query: executeQuery, type: dbType };
  }
}

async function executeQuery(sql, params = []) {
  if (!pool && !sqlJsDb) {
    await getDb();
  }

  if (dbType === 'mysql') {
    return await pool.query(sql, params);
  }

  // SQLite adapter for local development.
  const sqliteSql = sql
    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
    .replace(
      /CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi,
      'CURRENT_TIMESTAMP'
    )
    .replace(/ENUM\([^)]*\)/gi, 'TEXT')
    .replace(/MONTH\(([^)]+)\)/gi, "CAST(strftime('%m', $1) AS INTEGER)")
    .replace(/YEAR\(([^)]+)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");

  const trimmed = sqliteSql.trim();
  const isSelect = /^(SELECT|PRAGMA|SHOW|WITH)\b/i.test(trimmed);

  try {
    const boundParams = params.map((p) =>
      p instanceof Date ? p.toISOString() : p
    );

    if (isSelect) {
      const stmt = sqlJsDb.prepare(sqliteSql);
      stmt.bind(boundParams);

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }

      stmt.free();
      return [rows, null];
    }

    sqlJsDb.run(sqliteSql, boundParams);

    const meta = sqlJsDb.exec(
      'SELECT last_insert_rowid() AS lastId, changes() AS changes'
    );

    let insertId = 0;
    let changes = 0;

    if (meta?.length && meta[0].values?.length) {
      insertId = Number(meta[0].values[0][0]) || 0;
      changes = Number(meta[0].values[0][1]) || 0;
    }

    saveSqlJsDb();

    return [
      {
        insertId,
        affectedRows: changes,
        changedRows: changes
      },
      null
    ];
  } catch (err) {
    console.error(
      '[DB Query Error]',
      err.message,
      '\nSQL:',
      sqliteSql,
      '\nParams:',
      params
    );
    throw err;
  }
}

module.exports = {
  getDb,
  query: executeQuery,
  getDbType: () => dbType
};
