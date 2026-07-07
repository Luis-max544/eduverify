import 'dotenv/config';

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './src/db/schema.js',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
};
