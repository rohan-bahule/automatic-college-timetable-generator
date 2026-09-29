const mysql = require('mysql2/promise');

async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'timetable_db'}\`;`);
    await connection.end();
  } catch (err) {
    console.error('Database pre-check notice:', err.message);
  }
}

module.exports = ensureDatabaseExists;
