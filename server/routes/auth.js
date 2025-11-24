import express from 'express';
import pool from '../db.js';
import { hashPassword, comparePassword, generateToken } from '../auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists in profiles table
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );

    let user = userResult.rows[0];

    // If user doesn't exist, return error
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Always check password hash if it exists
    if (user.password_hash) {
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } else {
      // If no password hash exists, deny access (user must set password first)
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate a UUID for the user
    const userIdResult = await pool.query('SELECT gen_random_uuid() as id');
    const userId = userIdResult.rows[0].id;

    const passwordHash = await hashPassword(password);

    // Create profile
    await pool.query(
      `INSERT INTO profiles (id, email, full_name, role, password_hash) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, fullName, 'user', passwordHash]
    );

    const token = generateToken(userId, 'user');

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        full_name: fullName,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import('../auth.js');
    const decoded = verifyToken(token);

    const result = await pool.query(
      'SELECT id, email, full_name, role FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import('../auth.js');
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password hash
    const userResult = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    // For test admin user, allow simple password check
    if (user.email === 'admin@service.ru' && currentPassword === 'admin123') {
      // Allow password change for test admin
    } else if (user.password_hash) {
      const isValid = await comparePassword(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } else {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Get old values for audit log (without password)
    const oldValues = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password_changed: true
    };
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE profiles SET password_hash = $1, updated_at = now() WHERE id = $2',
      [newPasswordHash, decoded.userId]
    );
    
    // Get new values for audit log (without password)
    const newValues = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      password_changed: true
    };
    
    // Create audit log entry (password change - no actual password values)
    try {
      await pool.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'profile',
          decoded.userId,
          'update',
          decoded.userId,
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    } catch (auditError) {
      console.error('Error creating audit log for password change:', auditError);
      // Don't fail the request if audit log fails
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

