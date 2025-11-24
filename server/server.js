import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// Initialize database with test user if needed
async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminCheck = await pool.query(
      "SELECT id FROM profiles WHERE email = 'admin@service.ru'"
    );

    if (adminCheck.rows.length === 0) {
      console.log('Creating test admin user...');
      const userIdResult = await pool.query('SELECT gen_random_uuid() as id');
      const userId = userIdResult.rows[0].id;

      await pool.query(
        `INSERT INTO profiles (id, email, full_name, role) 
         VALUES ($1, $2, $3, $4)`,
        [userId, 'admin@service.ru', 'Администратор', 'admin']
      );
      console.log('Test admin user created: admin@service.ru / admin123');
    } else {
      console.log('Test admin user already exists: admin@service.ru / admin123');
    }

    // Insert some sample data if tables are empty
    const ordersCheck = await pool.query('SELECT COUNT(*) FROM service_orders');
    if (parseInt(ordersCheck.rows[0].count) === 0) {
      console.log('Database is empty. You can add sample data manually.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Make sure the database is set up correctly and migrations are applied.');
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initializeDatabase();
});

