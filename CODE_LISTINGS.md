# Листинги ключевого кода приложения KPI Dashboard

## BACKEND (Node.js + Express + PostgreSQL)

### 1. Главный файл сервера (`server/server.js`)

```javascript
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
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initializeDatabase();
});
```

### 2. Аутентификация и JWT (`server/auth.js`)

```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

// Хеширование пароля
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Сравнение пароля с хешем
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Генерация JWT токена (срок действия 30 дней)
export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '30d' });
}

// Верификация JWT токена
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware для проверки аутентификации
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

### 3. API роуты - Создание заказа и резервное копирование (`server/routes/data.js`)

```javascript
import express from 'express';
import pool from '../db.js';
import { authenticateUser } from '../auth.js';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateUser);

// Создание заказа на обслуживание
router.post('/orders', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      device_type,
      device_brand,
      device_model,
      issue_description,
      status,
      priority,
      estimated_cost,
      assigned_to
    } = req.body;

    if (!customer_name || !customer_phone || !device_type || !issue_description) {
      return res.status(400).json({ error: 'Required fields: customer_name, customer_phone, device_type, issue_description' });
    }

    // Генерация уникального номера заказа
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const orderNumberResult = await pool.query(
      "SELECT COUNT(*) as count FROM service_orders WHERE order_number LIKE $1",
      [`ORD-${today}-%`]
    );
    let count = parseInt(orderNumberResult.rows[0].count) + 1;
    let orderNumber = `ORD-${today}-${String(count).padStart(4, '0')}`;

    // Создание заказа
    const result = await pool.query(
      `INSERT INTO service_orders (
        order_number, customer_name, customer_phone, device_type, device_brand,
        device_model, issue_description, status, priority, estimated_cost, assigned_to
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        orderNumber,
        customer_name,
        customer_phone,
        device_type,
        device_brand || null,
        device_model || null,
        issue_description,
        status || 'pending',
        priority || 'normal',
        estimated_cost || null,
        assigned_to || null
      ]
    );

    const newOrder = result.rows[0];

    // Создание записи в журнале аудита
    try {
      if (req.user && req.user.id) {
        await pool.query(
          `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'order',
            newOrder.id,
            'create',
            req.user.id,
            null,
            JSON.stringify(newOrder)
          ]
        );
      }
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновление заказа с отслеживанием изменений
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Получение старых значений для журнала аудита
    const oldResult = await pool.query(
      `SELECT so.*, t.full_name as technician_name 
       FROM service_orders so 
       LEFT JOIN technicians t ON so.assigned_to = t.id 
       WHERE so.id = $1`,
      [id]
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldValues = oldResult.rows[0];

    // Обновление заказа
    const result = await pool.query(
      `UPDATE service_orders SET
        customer_name = COALESCE($1, customer_name),
        customer_phone = COALESCE($2, customer_phone),
        device_type = COALESCE($3, device_type),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        assigned_to = COALESCE($6, assigned_to),
        updated_at = now()
      WHERE id = $7
      RETURNING *`,
      [
        updateData.customer_name, updateData.customer_phone, updateData.device_type,
        updateData.status, updateData.priority, updateData.assigned_to,
        id
      ]
    );

    // Получение новых значений с именем техника
    const newResult = await pool.query(
      `SELECT so.*, t.full_name as technician_name 
       FROM service_orders so 
       LEFT JOIN technicians t ON so.assigned_to = t.id 
       WHERE so.id = $1`,
      [id]
    );

    const newValues = newResult.rows[0];

    // Создание записи в журнале аудита
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'order',
          id,
          'update',
          req.user.id,
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.json(newValues);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создание резервной копии
router.post('/backup/create', async (req, res) => {
  try {
    // Получение всех данных из базы
    const ordersResult = await pool.query('SELECT * FROM service_orders ORDER BY received_date DESC');
    const techniciansResult = await pool.query('SELECT * FROM technicians ORDER BY hire_date DESC');
    const usersResult = await pool.query('SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC');
    const auditLogResult = await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC');
    const notificationsResult = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');

    const backup = {
      version: '1.0',
      created_at: new Date().toISOString(),
      data: {
        orders: ordersResult.rows,
        technicians: techniciansResult.rows,
        users: usersResult.rows,
        audit_log: auditLogResult.rows,
        notifications: notificationsResult.rows
      }
    };

    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Восстановление из резервной копии
router.post('/backup/restore', async (req, res) => {
  try {
    const { backup } = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Очистка существующих данных (кроме пользователей)
      await client.query('DELETE FROM notifications');
      await client.query('DELETE FROM audit_log');
      await client.query('DELETE FROM service_orders');
      await client.query('DELETE FROM technicians');

      // Восстановление заказов
      if (backup.data.orders && backup.data.orders.length > 0) {
        for (const order of backup.data.orders) {
          await client.query(
            `INSERT INTO service_orders (
              id, order_number, customer_name, customer_phone, device_type, 
              device_brand, device_model, issue_description, status, priority, 
              received_date, completed_date, estimated_cost, final_cost, assigned_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO NOTHING`,
            [
              order.id, order.order_number, order.customer_name, order.customer_phone,
              order.device_type, order.device_brand, order.device_model, order.issue_description,
              order.status, order.priority, order.received_date, order.completed_date,
              order.estimated_cost, order.final_cost, order.assigned_to
            ]
          );
        }
      }

      // Восстановление техников
      if (backup.data.technicians && backup.data.technicians.length > 0) {
        for (const tech of backup.data.technicians) {
          await client.query(
            `INSERT INTO technicians (
              id, full_name, specialization, hire_date, is_active
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING`,
            [tech.id, tech.full_name, tech.specialization, tech.hire_date, tech.is_active]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Backup restored successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## FRONTEND (React + TypeScript + Vite)

### 1. Главный компонент приложения (`src/App.tsx`)

```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

### 2. API клиент (`src/lib/api.ts`)

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  async getOrders() {
    return this.request('/data/orders');
  }

  async createOrder(data: {
    customer_name: string;
    customer_phone: string;
    device_type: string;
    device_brand?: string;
    device_model?: string;
    issue_description: string;
    status?: string;
    priority?: string;
    estimated_cost?: number;
    assigned_to?: string;
  }) {
    return this.request('/data/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: {
    customer_name?: string;
    customer_phone?: string;
    device_type?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
  }) {
    return this.request(`/data/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAuditLog(entityType?: string, entityId?: string, limit?: number) {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return this.request(`/data/audit-log${query ? '?' + query : ''}`);
  }

  async createBackup() {
    return this.request('/data/backup/create', {
      method: 'POST',
    });
  }

  async restoreBackup(backup: any) {
    return this.request('/data/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backup }),
    });
  }

  logout() {
    localStorage.removeItem('token');
  }
}

export const api = new ApiClient();
```

### 3. Главная страница Dashboard - Расчет KPI (`src/pages/DashboardPage.tsx`)

```typescript
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { MetricCard } from '../components/MetricCard';
import { DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';
import { TrendingUp, CheckCircle, DollarSign, Clock } from 'lucide-react';

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('7');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const ordersData = await api.getOrders();
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Расчет метрик KPI
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Общая выручка
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.final_cost || o.estimated_cost || 0), 0);

  // Среднее время выполнения
  const completedWithDate = orders.filter(o => 
    o.status === 'completed' && o.completed_date && o.received_date
  );
  const avgCompletionTime = completedWithDate.length > 0
    ? completedWithDate.reduce((sum, o) => {
        const start = new Date(o.received_date);
        const end = new Date(o.completed_date!);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedWithDate.length
    : 0;

  // Распределение по статусам
  const orderStatusData = [
    { label: 'Завершено', value: completedOrders, color: '#10b981' },
    { label: 'В работе', value: inProgressOrders, color: '#3b82f6' },
    { label: 'Ожидает', value: pendingOrders, color: '#f59e0b' },
    { label: 'Отменено', value: cancelledOrders, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Фильтрация заказов по периоду
  const getFilteredOrders = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const daysAgo = new Date();
    daysAgo.setHours(0, 0, 0, 0);
    
    switch (period) {
      case '7': daysAgo.setDate(now.getDate() - 7); break;
      case '30': daysAgo.setDate(now.getDate() - 30); break;
      case '90': daysAgo.setDate(now.getDate() - 90); break;
      case '365': daysAgo.setDate(now.getDate() - 365); break;
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.received_date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate >= daysAgo && orderDate <= now;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Динамика заказов по дням
  const ordersByDate: Record<string, number> = {};
  filteredOrders.forEach(order => {
    const date = new Date(order.received_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    ordersByDate[date] = (ordersByDate[date] || 0) + 1;
  });

  const ordersData = Object.entries(ordersByDate)
    .sort(([a], [b]) => {
      const dateA = new Date(a.split('.').reverse().join('-'));
      const dateB = new Date(b.split('.').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    })
    .map(([label, value]) => ({ label, value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Карточки метрик */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Всего заказов"
          value={totalOrders}
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Завершено"
          value={completedOrders}
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Выручка"
          value={`${totalRevenue.toLocaleString('ru-RU')} ₽`}
          icon={<DollarSign />}
        />
        <MetricCard
          title="Среднее время"
          value={`${Math.round(avgCompletionTime)} ч`}
          icon={<Clock />}
        />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={orderStatusData} title="Распределение по статусам" />
        <LineChart data={ordersData} title="Динамика заказов" />
      </div>
    </div>
  );
}
```

---

## Заключение

Данные листинги представляют ключевые компоненты системы KPI Dashboard:

**Backend (3 файла):**
- `server.js` - настройка Express сервера с CORS и инициализацией БД
- `auth.js` - JWT аутентификация с bcrypt для паролей
- `routes/data.js` - CRUD операции для заказов с автоматическим аудитом и система резервного копирования

**Frontend (3 файла):**
- `App.tsx` - главный компонент приложения с провайдерами контекста
- `api.ts` - API клиент с автоматической отправкой JWT токенов
- `DashboardPage.tsx` - расчет и отображение KPI метрик с графиками

Все компоненты используют современные практики: async/await, обработка ошибок, типизация TypeScript, и разделение ответственности между слоями приложения.
