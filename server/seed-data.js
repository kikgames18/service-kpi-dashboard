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

async function seedData() {
  try {
    console.log('🌱 Начинаю добавление тестовых данных...\n');

    // Получаем существующих техников
    const techResult = await pool.query('SELECT id FROM technicians LIMIT 5');
    const technicianIds = techResult.rows.map(row => row.id);
    const initialTechCount = technicianIds.length;

    // Если техников меньше 5, создаем недостающих
    if (technicianIds.length < 5) {
      const technicians = [
        { full_name: 'Иванов Иван Иванович', specialization: 'computer' },
        { full_name: 'Петров Петр Петрович', specialization: 'household' },
        { full_name: 'Сидоров Сидор Сидорович', specialization: 'mobile' },
        { full_name: 'Кузнецов Алексей Викторович', specialization: 'universal' },
        { full_name: 'Смирнов Дмитрий Сергеевич', specialization: 'computer' },
      ];

      for (let i = technicianIds.length; i < 5; i++) {
        const tech = technicians[i];
        const result = await pool.query(
          `INSERT INTO technicians (full_name, specialization, hire_date, is_active)
           VALUES ($1, $2, CURRENT_DATE - INTERVAL '${Math.floor(Math.random() * 365)} days', true)
           RETURNING id`,
          [tech.full_name, tech.specialization]
        );
        technicianIds.push(result.rows[0].id);
      }
      const createdCount = technicianIds.length - initialTechCount;
      if (createdCount > 0) {
        console.log(`✅ Создано ${createdCount} техников`);
      }
    }

    // Проверяем существующие заказы
    const ordersCheck = await pool.query('SELECT COUNT(*) as count FROM service_orders');
    const ordersCount = parseInt(ordersCheck.rows[0].count);

    if (ordersCount < 5) {
      const orders = [
        {
          customer_name: 'Анна Волкова',
          customer_phone: '+7 (999) 123-45-67',
          device_type: 'laptop',
          device_brand: 'Lenovo',
          device_model: 'ThinkPad X1',
          issue_description: 'Не включается, не реагирует на кнопку питания',
          status: 'in_progress',
          priority: 'high',
          estimated_cost: 3500,
        },
        {
          customer_name: 'Михаил Соколов',
          customer_phone: '+7 (999) 234-56-78',
          device_type: 'computer',
          device_brand: 'HP',
          device_model: 'Pavilion',
          issue_description: 'Перегрев процессора, требуется замена термопасты',
          status: 'completed',
          priority: 'normal',
          estimated_cost: 1500,
          final_cost: 1500,
        },
        {
          customer_name: 'Елена Новикова',
          customer_phone: '+7 (999) 345-67-89',
          device_type: 'household_appliance',
          device_brand: 'Samsung',
          device_model: 'Стиральная машина WW80J52E0HW',
          issue_description: 'Не отжимает белье, ошибка E4',
          status: 'pending',
          priority: 'urgent',
          estimated_cost: 4500,
        },
        {
          customer_name: 'Дмитрий Лебедев',
          customer_phone: '+7 (999) 456-78-90',
          device_type: 'phone',
          device_brand: 'Apple',
          device_model: 'iPhone 12',
          issue_description: 'Разбит экран, требуется замена',
          status: 'in_progress',
          priority: 'high',
          estimated_cost: 8500,
        },
        {
          customer_name: 'Ольга Морозова',
          customer_phone: '+7 (999) 567-89-01',
          device_type: 'laptop',
          device_brand: 'ASUS',
          device_model: 'VivoBook 15',
          issue_description: 'Не работает клавиатура, несколько клавиш не реагируют',
          status: 'completed',
          priority: 'normal',
          estimated_cost: 2800,
          final_cost: 2800,
        },
      ];

      const today = new Date();
      for (let i = ordersCount; i < 5; i++) {
        const order = orders[i];
        const daysAgo = Math.floor(Math.random() * 30);
        const receivedDate = new Date(today);
        receivedDate.setDate(receivedDate.getDate() - daysAgo);

        let orderNumber = `ORD-${receivedDate.toISOString().split('T')[0].replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`;

        const assignedTo = technicianIds[Math.floor(Math.random() * technicianIds.length)];

        let completedDate = null;
        if (order.status === 'completed') {
          completedDate = new Date(receivedDate);
          completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 5) + 1);
        }

        await pool.query(
          `INSERT INTO service_orders (
            order_number, customer_name, customer_phone, device_type, device_brand,
            device_model, issue_description, status, priority, estimated_cost, final_cost,
            assigned_to, received_date, completed_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            orderNumber,
            order.customer_name,
            order.customer_phone,
            order.device_type,
            order.device_brand,
            order.device_model,
            order.issue_description,
            order.status,
            order.priority,
            order.estimated_cost,
            order.final_cost || null,
            assignedTo,
            receivedDate.toISOString(),
            completedDate ? completedDate.toISOString() : null,
          ]
        );
      }
      console.log(`✅ Создано ${5 - ordersCount} заказов`);
    }

    // Добавляем KPI метрики
    const metricsCheck = await pool.query('SELECT COUNT(*) as count FROM kpi_metrics');
    const metricsCount = parseInt(metricsCheck.rows[0].count);

    if (metricsCount < 5) {
      const today = new Date();
      for (let i = metricsCount; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const totalOrders = Math.floor(Math.random() * 10) + 5;
        const completedOrders = Math.floor(totalOrders * 0.7);
        const cancelledOrders = Math.floor(totalOrders * 0.1);
        const revenue = completedOrders * (Math.random() * 3000 + 2000);
        const avgTime = Math.random() * 24 + 12;
        const satisfaction = Math.random() * 1.5 + 3.5;

        await pool.query(
          `INSERT INTO kpi_metrics (
            metric_date, total_orders, completed_orders, cancelled_orders,
            revenue, avg_completion_time_hours, customer_satisfaction
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (metric_date) DO NOTHING`,
          [
            date.toISOString().split('T')[0],
            totalOrders,
            completedOrders,
            cancelledOrders,
            Math.round(revenue),
            Math.round(avgTime * 10) / 10,
            Math.round(satisfaction * 100) / 100,
          ]
        );
      }
      console.log(`✅ Создано ${5 - metricsCount} записей KPI метрик`);
    }

    console.log('\n✅ Тестовые данные успешно добавлены!');
  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых данных:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedData();

