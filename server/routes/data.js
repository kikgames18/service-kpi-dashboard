import express from 'express';
import pool from '../db.js';
import { authenticateUser } from '../auth.js';
import { upload } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'technician',
          result.rows[0].id,
          'create',
          req.user.id,
          null,
          JSON.stringify(result.rows[0])
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

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

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM technicians WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    const oldValues = oldResult.rows[0];

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

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'technician',
          id,
          'update',
          req.user.id,
          JSON.stringify(oldValues),
          JSON.stringify(result.rows[0])
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit log fails
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

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM technicians WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    const oldValues = oldResult.rows[0];

    const result = await pool.query(
      'DELETE FROM technicians WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'technician',
          id,
          'delete',
          req.user.id,
          JSON.stringify(oldValues),
          null
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
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

    // Normalize assigned_to: convert empty string to null, validate UUID format
    let assignedToValue = null;
    if (assigned_to && assigned_to !== '' && assigned_to !== 'undefined' && assigned_to !== 'null') {
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(String(assigned_to))) {
        assignedToValue = String(assigned_to);
      } else {
        console.warn(`Invalid UUID format for assigned_to: ${assigned_to}, setting to null`);
        assignedToValue = null;
      }
    }

    // Generate order number - use timestamp to ensure uniqueness
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const orderNumberResult = await pool.query(
      "SELECT COUNT(*) as count FROM service_orders WHERE order_number LIKE $1",
      [`ORD-${today}-%`]
    );
    let count = parseInt(orderNumberResult.rows[0].count) + 1;
    let orderNumber = `ORD-${today}-${String(count).padStart(4, '0')}`;
    
    // Double-check uniqueness (in case of race condition)
    let existingOrder = await pool.query(
      'SELECT id FROM service_orders WHERE order_number = $1',
      [orderNumber]
    );
    if (existingOrder.rows.length > 0) {
      // If exists, add timestamp milliseconds to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      orderNumber = `ORD-${today}-${String(count).padStart(4, '0')}-${timestamp}`;
    }

    // Ensure estimated_cost is properly formatted as decimal
    const estimatedCostValue = estimated_cost ? parseFloat(estimated_cost) : null;
    
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
        estimatedCostValue,
        assignedToValue
      ]
    );

    const newOrder = result.rows[0];

    // Create audit log entry
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

    // Create notification for assigned technician
    try {
      if (assignedToValue) {
        // Check if technician exists and get their profile_id if available
        const techProfile = await pool.query(
          'SELECT profile_id FROM technicians WHERE id = $1',
          [assignedToValue]
        );
        // Only create notification if technician has a profile_id
        // Note: profile_id might be null for some technicians, which is OK
        if (techProfile.rows.length > 0 && techProfile.rows[0].profile_id) {
          try {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message, link)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                techProfile.rows[0].profile_id,
                'info',
                'Новый заказ назначен',
                `Вам назначен новый заказ ${orderNumber}`,
                `/orders`
              ]
            );
          } catch (notifError) {
            console.error('Error creating technician notification:', notifError);
            // Don't fail the order creation if notification fails
          }
        }
      }

      // Notify admins about new order
      try {
        const admins = await pool.query(
          'SELECT id FROM profiles WHERE role = $1',
          ['admin']
        );
        for (const admin of admins.rows) {
          try {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message, link)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                admin.id,
                'info',
                'Новый заказ',
                `Создан новый заказ ${orderNumber}`,
                `/orders`
              ]
            );
          } catch (adminNotifError) {
            console.error('Error creating admin notification:', adminNotifError);
            // Don't fail the order creation if notification fails
          }
        }
      } catch (adminError) {
        console.error('Error fetching admins for notification:', adminError);
        // Don't fail the order creation if admin notification fails
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM service_orders WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const oldValues = oldResult.rows[0];

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

    const newValues = result.rows[0];

    // Get technician names for old and new assigned_to
    let oldTechnicianName = null;
    let newTechnicianName = null;
    
    if (oldValues.assigned_to) {
      const oldTech = await pool.query('SELECT full_name FROM technicians WHERE id = $1', [oldValues.assigned_to]);
      if (oldTech.rows.length > 0) {
        oldTechnicianName = oldTech.rows[0].full_name;
      }
    }
    
    if (newValues.assigned_to) {
      const newTech = await pool.query('SELECT full_name FROM technicians WHERE id = $1', [newValues.assigned_to]);
      if (newTech.rows.length > 0) {
        newTechnicianName = newTech.rows[0].full_name;
      }
    }

    // Add technician names to values for audit log
    const oldValuesForLog = { ...oldValues, technician_name: oldTechnicianName };
    const newValuesForLog = { ...newValues, technician_name: newTechnicianName };

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'order',
          id,
          'update',
          req.user.id,
          JSON.stringify(oldValuesForLog),
          JSON.stringify(newValuesForLog)
        ]
      );

      // Create notification if order status changed to completed
      if (status === 'completed' && oldValues.status !== 'completed') {
        // Notify assigned technician if exists
        if (newValues.assigned_to) {
          const techProfile = await pool.query(
            'SELECT profile_id FROM technicians WHERE id = $1',
            [newValues.assigned_to]
          );
          if (techProfile.rows.length > 0 && techProfile.rows[0].profile_id) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message, link)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                techProfile.rows[0].profile_id,
                'success',
                'Заказ завершен',
                `Заказ ${newValues.order_number} успешно завершен`,
                `/orders`
              ]
            );
          }
        }
      }

      // Create notification if order assigned to technician
      if (assigned_to && oldValues.assigned_to !== assigned_to) {
        const techProfile = await pool.query(
          'SELECT profile_id FROM technicians WHERE id = $1',
          [assigned_to]
        );
        if (techProfile.rows.length > 0 && techProfile.rows[0].profile_id) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              techProfile.rows[0].profile_id,
              'info',
              'Новый заказ назначен',
              `Вам назначен заказ ${newValues.order_number}`,
              `/orders`
            ]
          );
        }
      }
    } catch (auditError) {
      console.error('Error creating audit log or notification:', auditError);
      // Don't fail the request if audit log fails
    }

    res.json(newValues);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service order
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get old values for audit log
    const oldResult = await pool.query('SELECT * FROM service_orders WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const oldValues = oldResult.rows[0];

    const result = await pool.query(
      'DELETE FROM service_orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'order',
          id,
          'delete',
          req.user.id,
          JSON.stringify(oldValues),
          null
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
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

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const { full_name, email } = req.body;
    
    // Get old values for audit log
    const oldResult = await pool.query(
      'SELECT id, email, full_name, role FROM profiles WHERE id = $1',
      [req.user.id]
    );
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const oldValues = oldResult.rows[0];
    
    const result = await pool.query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           updated_at = now()
       WHERE id = $3
       RETURNING id, email, full_name, role`,
      [full_name, email, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const newValues = result.rows[0];
    
    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'profile',
          req.user.id,
          'update',
          req.user.id,
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit log fails
    }
    
    res.json(newValues);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    
    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit log
// Backup: Create backup
router.post('/backup/create', async (req, res) => {
  try {
    console.log('Creating backup...');
    
    // Get all data from database - execute queries one by one to catch specific errors
    let ordersResult, techniciansResult, usersResult, auditLogResult, notificationsResult;
    
    try {
      ordersResult = await pool.query('SELECT * FROM service_orders ORDER BY received_date DESC');
      console.log(`Loaded ${ordersResult.rows.length} orders`);
    } catch (err) {
      console.error('Error loading orders:', err);
      throw new Error(`Failed to load orders: ${err.message}`);
    }
    
    try {
      techniciansResult = await pool.query('SELECT * FROM technicians ORDER BY hire_date DESC');
      console.log(`Loaded ${techniciansResult.rows.length} technicians`);
    } catch (err) {
      console.error('Error loading technicians:', err);
      // Technicians table might not exist, continue with empty array
      console.log('Technicians table not found, continuing with empty array');
      techniciansResult = { rows: [] };
    }
    
    try {
      usersResult = await pool.query('SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC');
      console.log(`Loaded ${usersResult.rows.length} users`);
    } catch (err) {
      console.error('Error loading users:', err);
      throw new Error(`Failed to load users: ${err.message}`);
    }
    
    try {
      auditLogResult = await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC');
      console.log(`Loaded ${auditLogResult.rows.length} audit log entries`);
    } catch (err) {
      console.error('Error loading audit log:', err);
      // Audit log might not exist, continue with empty array
      auditLogResult = { rows: [] };
    }
    
    try {
      notificationsResult = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
      console.log(`Loaded ${notificationsResult.rows.length} notifications`);
    } catch (err) {
      console.error('Error loading notifications:', err);
      // Notifications might not exist, continue with empty array
      notificationsResult = { rows: [] };
    }

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

    console.log('Backup created successfully');
    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create backup',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Backup: Restore from backup
router.post('/backup/restore', async (req, res) => {
  try {
    const { backup } = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing data (except users to preserve authentication)
      await client.query('DELETE FROM notifications');
      await client.query('DELETE FROM audit_log');
      await client.query('DELETE FROM order_attachments');
      await client.query('DELETE FROM service_orders');
      await client.query('DELETE FROM technicians');

      // Restore orders
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

      // Restore technicians
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

      // Restore audit log
      if (backup.data.audit_log && backup.data.audit_log.length > 0) {
        for (const log of backup.data.audit_log) {
          await client.query(
            `INSERT INTO audit_log (
              id, entity_type, entity_id, action, changed_by, old_values, new_values, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING`,
            [
              log.id, log.entity_type, log.entity_id, log.action,
              log.changed_by || log.user_id, log.old_values, log.new_values, log.created_at
            ]
          );
        }
      }

      // Restore notifications
      if (backup.data.notifications && backup.data.notifications.length > 0) {
        for (const notif of backup.data.notifications) {
          await client.query(
            `INSERT INTO notifications (
              id, user_id, type, title, message, link, is_read, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO NOTHING`,
            [
              notif.id, notif.user_id, notif.type, 
              notif.title || '', notif.message || '', notif.link || null,
              notif.is_read || false, notif.created_at
            ]
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

router.get('/audit-log', async (req, res) => {
  try {
    const { entity_type, entity_id, limit = 50 } = req.query;
    let query = 'SELECT al.*, p.email as changed_by_email, p.full_name as changed_by_name FROM audit_log al LEFT JOIN profiles p ON al.changed_by = p.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (entity_type) {
      params.push(entity_type);
      query += ` AND al.entity_type = $${paramIndex}`;
      paramIndex++;
    }
    
    if (entity_id) {
      params.push(entity_id);
      query += ` AND al.entity_id = $${paramIndex}`;
      paramIndex++;
    }
    
    params.push(parseInt(limit));
    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get order attachments
router.get('/orders/:id/attachments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_size, file_type, created_at, uploaded_by
       FROM order_attachments
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload file to order
router.post('/orders/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await pool.query(
      `INSERT INTO order_attachments (order_id, file_name, file_path, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.id,
        req.file.originalname,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download file
router.get('/attachments/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path, file_name FROM order_attachments WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '../uploads', result.rows[0].file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, result.rows[0].file_name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attachment
router.delete('/attachments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_path FROM order_attachments WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from database
    await pool.query('DELETE FROM order_attachments WHERE id = $1', [req.params.id]);

    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads', result.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

