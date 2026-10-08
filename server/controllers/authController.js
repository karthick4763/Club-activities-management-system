const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [users] = await query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.club_id, c.club_name 
       FROM users u 
       LEFT JOIN clubs c ON u.club_id = c.id 
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Business Rule & Security: Member accounts must have status APPROVED
    if (user.role === 'MEMBER') {
      const [memberRecords] = await query(
        'SELECT status FROM members WHERE email = ? AND (club_id = ? OR club_id IS NULL)',
        [user.email.toLowerCase(), user.club_id]
      );
      if (memberRecords && memberRecords.length > 0) {
        if (memberRecords[0].status === 'PENDING') {
          return res.status(403).json({
            success: false,
            message: 'Your membership is pending administrator approval. Please wait for an admin to review your application.'
          });
        }
        if (memberRecords[0].status === 'REJECTED') {
          return res.status(403).json({
            success: false,
            message: 'Your membership application was rejected by the administrator.'
          });
        }
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        club_id: user.club_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        club_id: user.club_id,
        club_name: user.club_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user
  });
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long.' 
      });
    }

    const [users] = await query('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incorrect current password. Please verify and try again.' 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    return res.status(200).json({ 
      success: true, 
      message: 'Password has been updated successfully.' 
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error while changing password.' 
    });
  }
}

module.exports = {
  login,
  getMe,
  changePassword
};
