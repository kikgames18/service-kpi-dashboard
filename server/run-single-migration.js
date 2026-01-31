import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'service_kpi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
});

async function main() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', 'add_audit_and_notifications.sql');
    console.log('Выполняю миграцию:', migrationPath);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    console.log('✅ Миграция выполнена успешно!');
  } catch (error) {
    if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
      console.log('⚠️  Таблицы уже существуют, пропускаю...');
    } else {
      console.error('❌ Ошибка:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main();







