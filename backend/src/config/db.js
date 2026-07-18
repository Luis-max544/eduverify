import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from './env.js';
import * as schema from '../db/schema.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10_000,
});

pool.on('error', (err) => { console.error('MySQL pool error:', err.message); });

export const db = drizzle(pool, { schema, mode: 'default' });

export async function checkDbConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}
