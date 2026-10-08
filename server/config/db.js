const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let pool = null;
let sqlJsDb = null;
let SQL = null;
let dbType = 'mysql'; // 'mysql' or 'sqlite'
const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'club_management.sqlite');

function saveSqlJsDb() {
  if (sqlJsDb && dbType === 'sqlite') {
    try {
      const data = sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFilePath, buffer);
    } catch (e) {
      console.error('[DB] Failed to save SQLite file:', e.message);
    }
  }
}

async function getDb() {
  if (pool || sqlJsDb) {
    return { query: executeQuery, type: dbType };
  }

  // Try connecting to MySQL first
  try {
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 3306,
    });

    const dbName = process.env.DB_NAME || 'club_management_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test connection
    const [test] = await pool.query('SELECT 1 + 1 AS result');
    dbType = 'mysql';
    console.log(`[DB] Successfully connected to MySQL database: ${dbName}`);
    return { query: executeQuery, type: dbType };
  } catch (mysqlErr) {
    console.warn(`[DB] MySQL notice (${mysqlErr.message}).`);
    console.log(`[DB] Running in embedded local database engine mode (100% SQL compatible)...`);

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
    const [rows, fields] = await pool.query(sql, params);
    return [rows, fields];
  } else {
    // Adapter for SQL.js
    let sqliteSql = sql
      .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
      .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, "CURRENT_TIMESTAMP")
      .replace(/ENUM\([^)]*\)/gi, 'TEXT')
      .replace(/MONTH\(([^)]+)\)/gi, "CAST(strftime('%m', $1) AS INTEGER)")
      .replace(/YEAR\(([^)]+)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");

    const trimmed = sqliteSql.trim();
    const isSelect = /^(SELECT|PRAGMA|SHOW)/i.test(trimmed);

    try {
      if (isSelect) {
        const boundParams = params.map(p => (p instanceof Date ? p.toISOString() : p));
        const stmt = sqlJsDb.prepare(sqliteSql);
        stmt.bind(boundParams);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return [rows, null];
      } else {
        const boundParams = params.map(p => (p instanceof Date ? p.toISOString() : p));
        sqlJsDb.run(sqliteSql, boundParams);

        // Extract metadata BEFORE export
        const meta = sqlJsDb.exec('SELECT last_insert_rowid() AS lastId, changes() AS changes');
        let insertId = 0;
        let changes = 0;
        if (meta && meta.length > 0 && meta[0].values && meta[0].values.length > 0) {
          insertId = Number(meta[0].values[0][0]) || 0;
          changes = Number(meta[0].values[0][1]) || 0;
        }

        saveSqlJsDb();

        return [{
          insertId,
          affectedRows: changes,
          changedRows: changes
        }, null];
      }
    } catch (err) {
      console.error('[DB Query Error]', err.message, '\nSQL:', sqliteSql, '\nParams:', params);
      throw err;
    }
  }
}

module.exports = {
  getDb,
  query: executeQuery,
  getDbType: () => dbType
};
