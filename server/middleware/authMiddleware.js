const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function verifyToken(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user details
    const [users] = await query(
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.club_name 
       FROM users u 
       LEFT JOIN clubs c ON u.club_id = c.id 
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token: User no longer exists.' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Unauthorized. Admin privileges required.' });
  }
  next();
}

function requireCoordinator(req, res, next) {
  if (!req.user || req.user.role !== 'COORDINATOR') {
    return res.status(403).json({ success: false, message: 'Unauthorized. Coordinator privileges required.' });
  }
  next();
}

function requireClubMemberOrCoordinator(req, res, next) {
  if (!req.user || (req.user.role !== 'COORDINATOR' && req.user.role !== 'MEMBER' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Unauthorized. Club privileges required.' });
  }
  next();
}

function requireClubAccess(req, res, next) {
  if (req.user.role === 'ADMIN') {
    return next();
  }
  
  const targetClubId = Number(req.params.clubId || req.body.club_id || req.query.club_id);
  if (targetClubId && Number(req.user.club_id) !== targetClubId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access forbidden. You cannot access or modify another club container.' 
    });
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireCoordinator,
  requireClubMemberOrCoordinator,
  requireClubAccess
};
