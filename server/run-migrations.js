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

async function runMigration(filePath, description) {
  try {
    console.log(`\n📄 Выполняю миграцию: ${description}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Выполняем весь SQL файл целиком
    await pool.query(sql);
    
    console.log(`✅ Миграция выполнена успешно: ${description}`);
    return true;
  } catch (error) {
    // Игнорируем ошибки о том, что объекты уже существуют
    if (error.message.includes('already exists') || 
        error.message.includes('уже существует') ||
        error.code === '42P07' || // duplicate_table
        error.code === '42710') { // duplicate_object
      console.log(`⚠️  Пропускаю (уже существует): ${error.message}`);
      return true;
    }
    console.error(`❌ Ошибка при выполнении миграции ${description}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Начинаю выполнение миграций базы данных...\n');
    console.log(`📊 Подключение к базе данных: ${process.env.DB_NAME || 'service_kpi'}`);
    
    // Проверка подключения
    await pool.query('SELECT 1');
    console.log('✅ Подключение к базе данных установлено\n');

    const migrations = [
      {
        path: path.join(__dirname, 'migrations', '01_create_schema_fixed.sql'),
        description: 'Основная схема базы данных (без Supabase)'
      },
      {
        path: path.join(__dirname, 'migrations', 'complete_setup.sql'),
        description: 'Создание тестового пользователя'
      }
    ];

    for (const migration of migrations) {
      if (fs.existsSync(migration.path)) {
        await runMigration(migration.path, migration.description);
      } else {
        console.log(`⚠️  Файл не найден: ${migration.path}`);
      }
    }

    console.log('\n✅ Все миграции выполнены успешно!');
    console.log('\n📝 Тестовый пользователь:');
    console.log('   Email: admin@service.ru');
    console.log('   Пароль: admin123');
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
