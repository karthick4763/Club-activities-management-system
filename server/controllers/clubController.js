const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function getClubs(req, res) {
  try {
    const { category } = req.query;

    let sql = `
      SELECT 
        c.id, 
        c.club_name, 
        c.description, 
        c.category, 
        c.created_at,
        u.id AS coordinator_id,
        u.name AS coordinator_name,
        u.email AS coordinator_email,
        COUNT(DISTINCT m.id) AS total_members,
        COUNT(DISTINCT CASE WHEN m.status = 'APPROVED' THEN m.id END) AS approved_members,
        COUNT(DISTINCT CASE WHEN m.status = 'PENDING' THEN m.id END) AS pending_members,
        COUNT(DISTINCT e.id) AS total_events
      FROM clubs c
      LEFT JOIN users u ON u.club_id = c.id AND u.role = 'COORDINATOR'
      LEFT JOIN members m ON m.club_id = c.id
      LEFT JOIN events e ON e.club_id = c.id
      WHERE 1=1
    `;

    const params = [];
    // If coordinator, limit to their club
    if (req.user.role === 'COORDINATOR') {
      sql += ` AND c.id = ?`;
      params.push(req.user.club_id);
    } else if (category && category !== 'ALL') {
      sql += ` AND c.category = ?`;
      params.push(category);
    }

    sql += ` GROUP BY c.id ORDER BY c.club_name ASC`;

    const [clubs] = await query(sql, params);
    return res.status(200).json({ success: true, clubs });
  } catch (err) {
    console.error('getClubs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch clubs.' });
  }
}

async function getClubById(req, res) {
  try {
    const clubId = req.params.id;
    if (req.user.role === 'COORDINATOR' && Number(req.user.club_id) !== Number(clubId)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access to this club is restricted.' });
    }

    const [clubs] = await query(
      `SELECT c.*, u.name AS coordinator_name, u.email AS coordinator_email 
       FROM clubs c 
       LEFT JOIN users u ON u.club_id = c.id AND u.role = 'COORDINATOR'
       WHERE c.id = ?`,
      [clubId]
    );

    if (!clubs || clubs.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    return res.status(200).json({ success: true, club: clubs[0] });
  } catch (err) {
    console.error('getClubById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch club details.' });
  }
}

async function createClub(req, res) {
  try {
    const { 
      club_name, 
      description, 
      category, 
      coordinator_name, 
      coordinator_email, 
      coordinator_password 
    } = req.body;

    if (!club_name || !club_name.trim()) {
      return res.status(400).json({ success: false, message: 'Club name is required.' });
    }

    const validCategory = category === 'Non-Technical' ? 'Non-Technical' : 'Technical';

    const [result] = await query(
      'INSERT INTO clubs (club_name, description, category) VALUES (?, ?, ?)',
      [club_name.trim(), description || '', validCategory]
    );

    const newClubId = result.insertId;

    // Handle Coordinator creation or assignment if email is provided
    let assignedCoordinator = null;
    if (coordinator_email && coordinator_email.trim()) {
      const email = coordinator_email.trim().toLowerCase();
      const coordName = (coordinator_name && coordinator_name.trim()) || `${club_name.trim()} Coordinator`;
      const plainPassword = (coordinator_password && coordinator_password.trim()) || 'Coord@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Check if user with email already exists
      const [existingUsers] = await query('SELECT id, role FROM users WHERE email = ?', [email]);
      if (existingUsers && existingUsers.length > 0) {
        // Update user to be coordinator for this new club
        await query(
          `UPDATE users SET name = ?, role = 'COORDINATOR', club_id = ? WHERE id = ?`,
          [coordName, newClubId, existingUsers[0].id]
        );
        assignedCoordinator = { id: existingUsers[0].id, name: coordName, email };
      } else {
        // Create new coordinator user
        const [userRes] = await query(
          `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, 'COORDINATOR', ?)`,
          [coordName, email, hashedPassword, newClubId]
        );
        assignedCoordinator = { id: userRes.insertId, name: coordName, email };
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Club created successfully with coordinator assigned.',
      clubId: newClubId,
      coordinator: assignedCoordinator
    });
  } catch (err) {
    console.error('createClub error:', err);
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: 'A club with this name already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create club.' });
  }
}

async function updateClub(req, res) {
  try {
    const clubId = req.params.id;
    const { 
      club_name, 
      description, 
      category, 
      coordinator_name, 
      coordinator_email, 
      coordinator_password 
    } = req.body;

    const [clubs] = await query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!clubs || clubs.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    const validCategory = category === 'Non-Technical' ? 'Non-Technical' : 'Technical';

    await query(
      `UPDATE clubs SET club_name = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        club_name ? club_name.trim() : clubs[0].club_name,
        description !== undefined ? description : clubs[0].description,
        validCategory,
        clubId
      ]
    );

    // Handle Coordinator Assignment/Update
    if (coordinator_email && coordinator_email.trim()) {
      const email = coordinator_email.trim().toLowerCase();
      const coordName = (coordinator_name && coordinator_name.trim()) || `${club_name || clubs[0].club_name} Coordinator`;

      const [existingUsers] = await query('SELECT id, role FROM users WHERE email = ?', [email]);
      if (existingUsers && existingUsers.length > 0) {
        if (coordinator_password && coordinator_password.trim()) {
          const hashedPassword = await bcrypt.hash(coordinator_password.trim(), 10);
          await query(
            `UPDATE users SET name = ?, password = ?, role = 'COORDINATOR', club_id = ? WHERE id = ?`,
            [coordName, hashedPassword, clubId, existingUsers[0].id]
          );
        } else {
          await query(
            `UPDATE users SET name = ?, role = 'COORDINATOR', club_id = ? WHERE id = ?`,
            [coordName, clubId, existingUsers[0].id]
          );
        }
      } else {
        const plainPassword = (coordinator_password && coordinator_password.trim()) || 'Coord@123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await query(
          `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, 'COORDINATOR', ?)`,
          [coordName, email, hashedPassword, clubId]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Club details and coordinator updated successfully.'
    });
  } catch (err) {
    console.error('updateClub error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update club: ' + err.message });
  }
}

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub
};

