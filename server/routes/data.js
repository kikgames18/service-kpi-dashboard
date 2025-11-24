import express from 'express';
import pool from '../db.js';
import { authenticateUser } from '../auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Get KPI metrics
router.get('/kpi-metrics', async (req, res) => {
  try {
    const { limit = 7 } = req.query;
    const result = await pool.query(
      'SELECT * FROM kpi_metrics ORDER BY metric_date DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service orders
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT so.*, t.full_name as technician_name 
       FROM service_orders so 
       LEFT JOIN technicians t ON so.assigned_to = t.id 
       ORDER BY so.received_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get technicians
router.get('/technicians', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM technicians ORDER BY full_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create technician
router.post('/technicians', async (req, res) => {
  try {
    const { full_name, specialization, hire_date, is_active } = req.body;
    
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(
      `INSERT INTO technicians (full_name, specialization, hire_date, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        full_name,
        specialization || null,
        hire_date || new Date().toISOString().split('T')[0],
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update technician
router.put('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, specialization, hire_date, is_active } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(
      `UPDATE technicians SET
        full_name = $1,
        specialization = $2,
        hire_date = $3,
        is_active = $4
      WHERE id = $5
      RETURNING *`,
      [
        full_name,
        specialization || null,
        hire_date,
        is_active !== undefined ? is_active : true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating technician:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete technician
router.delete('/technicians/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM technicians WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json({ message: 'Technician deleted successfully' });
  } catch (error) {
    console.error('Error deleting technician:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create service order
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

    // Generate order number
    const orderNumberResult = await pool.query(
      "SELECT COUNT(*) as count FROM service_orders WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%'"
    );
    const count = parseInt(orderNumberResult.rows[0].count) + 1;
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(count).padStart(4, '0')}`;

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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service order
router.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      final_cost,
      assigned_to,
      completed_date
    } = req.body;

    const result = await pool.query(
      `UPDATE service_orders SET
        customer_name = COALESCE($1, customer_name),
        customer_phone = COALESCE($2, customer_phone),
        device_type = COALESCE($3, device_type),
        device_brand = COALESCE($4, device_brand),
        device_model = COALESCE($5, device_model),
        issue_description = COALESCE($6, issue_description),
        status = COALESCE($7, status),
        priority = COALESCE($8, priority),
        estimated_cost = COALESCE($9, estimated_cost),
        final_cost = COALESCE($10, final_cost),
        assigned_to = COALESCE($11, assigned_to),
        completed_date = COALESCE($12, completed_date),
        updated_at = now()
      WHERE id = $13
      RETURNING *`,
      [
        customer_name,
        customer_phone,
        device_type,
        device_brand,
        device_model,
        issue_description,
        status,
        priority,
        estimated_cost,
        final_cost,
        assigned_to,
        completed_date,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service order
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM service_orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profile
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role FROM profiles WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

