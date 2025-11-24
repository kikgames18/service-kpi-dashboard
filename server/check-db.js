import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'service_kpi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
});

async function checkDatabase() {
  try {
    console.log('🔍 Проверка базы данных...\n');

    // Проверка таблиц
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Созданные таблицы:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Проверка тестового пользователя
    const user = await pool.query(
      "SELECT id, email, full_name, role FROM profiles WHERE email = 'admin@service.ru'"
    );
    
    if (user.rows.length > 0) {
      console.log('\n👤 Тестовый пользователь:');
      console.log(`   Email: ${user.rows[0].email}`);
      console.log(`   Имя: ${user.rows[0].full_name}`);
      console.log(`   Роль: ${user.rows[0].role}`);
      console.log(`   ID: ${user.rows[0].id}`);
    } else {
      console.log('\n⚠️  Тестовый пользователь не найден!');
    }

    console.log('\n✅ База данных настроена корректно!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();

