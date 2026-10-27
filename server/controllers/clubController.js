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
        c.existing_alumni_count,
        c.existing_events_completed_count,
        c.created_at,
        MAX(u.id) AS coordinator_id,
        MAX(u.name) AS coordinator_name,
        MAX(u.email) AS coordinator_email,
        COUNT(DISTINCT m.id) AS total_members,
        COUNT(DISTINCT CASE WHEN m.member_type = 'STUDENT' THEN m.id END) AS student_members,
        COUNT(DISTINCT CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'APPROVED' THEN m.id END) AS approved_alumni,
        COUNT(DISTINCT CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'PENDING' THEN m.id END) AS pending_alumni,
        COUNT(DISTINCT CASE WHEN m.status = 'APPROVED' THEN m.id END) AS approved_members,
        COUNT(DISTINCT CASE WHEN m.status = 'PENDING' THEN m.id END) AS pending_members,
        COUNT(DISTINCT e.id) AS total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END) AS completed_events
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

    const [rawClubs] = await query(sql, params);
    const clubs = rawClubs.map(c => {
      const existingAlumni = Number(c.existing_alumni_count) || 0;
      const portalApprovedAlumni = Number(c.approved_alumni) || 0;
      const actualAlumni = existingAlumni + portalApprovedAlumni;
      const existingEvents = Number(c.existing_events_completed_count) || 0;
      const portalCompletedEvents = Number(c.completed_events) || 0;
      const actualCompletedEvents = existingEvents + portalCompletedEvents;

      return {
        ...c,
        existing_alumni_count: existingAlumni,
        portal_approved_alumni: portalApprovedAlumni,
        actual_alumni: actualAlumni,
        existing_events_completed_count: existingEvents,
        portal_completed_events: portalCompletedEvents,
        actual_completed_events: actualCompletedEvents
      };
    });

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
      existing_alumni_count,
      existing_events_completed_count,
      coordinator_name, 
      coordinator_email, 
      coordinator_password 
    } = req.body;

    if (!club_name || !club_name.trim()) {
      return res.status(400).json({ success: false, message: 'Club name is required.' });
    }

    const validCategory = category === 'Non-Technical' ? 'Non-Technical' : 'Technical';
    const alumniCount = Math.max(0, Number(existing_alumni_count) || 0);
    const eventsCount = Math.max(0, Number(existing_events_completed_count) || 0);

    const [result] = await query(
      'INSERT INTO clubs (club_name, description, category, existing_alumni_count, existing_events_completed_count) VALUES (?, ?, ?, ?, ?)',
      [club_name.trim(), description || '', validCategory, alumniCount, eventsCount]
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
    const clubId = Number(req.params.id);
    if (!clubId) {
      return res.status(400).json({ success: false, message: 'Valid Club ID is required.' });
    }

    // Role check: Only ADMIN or the assigned COORDINATOR can update
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Members have read-only permissions.' });
    }

    if (req.user.role === 'COORDINATOR' && Number(req.user.club_id) !== clubId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your assigned club.' });
    }

    const { 
      club_name, 
      description, 
      category, 
      existing_alumni_count,
      existing_events_completed_count,
      coordinator_name, 
      coordinator_email, 
      coordinator_password 
    } = req.body;

    const [clubs] = await query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!clubs || clubs.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    // Check for duplicate club name if name is being changed
    const targetName = club_name ? club_name.trim() : clubs[0].club_name;
    if (targetName.toLowerCase() !== clubs[0].club_name.toLowerCase()) {
      const [duplicate] = await query(
        'SELECT id FROM clubs WHERE LOWER(club_name) = ? AND id != ?',
        [targetName.toLowerCase(), clubId]
      );
      if (duplicate && duplicate.length > 0) {
        return res.status(400).json({ success: false, message: 'A club with this name already exists. Please choose a different name.' });
      }
    }

    const validCategory = category === 'Non-Technical' ? 'Non-Technical' : (category === 'Technical' ? 'Technical' : clubs[0].category);
    const alumniCount = existing_alumni_count !== undefined 
      ? Math.max(0, Number(existing_alumni_count) || 0) 
      : (clubs[0].existing_alumni_count || 0);
    const eventsCount = existing_events_completed_count !== undefined 
      ? Math.max(0, Number(existing_events_completed_count) || 0) 
      : (clubs[0].existing_events_completed_count || 0);

    const targetDesc = description !== undefined ? description : clubs[0].description;

    await query(
      `UPDATE clubs SET club_name = ?, description = ?, category = ?, existing_alumni_count = ?, existing_events_completed_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        targetName,
        targetDesc,
        validCategory,
        alumniCount,
        eventsCount,
        clubId
      ]
    );

    // Only administrators can reassign coordinator account or change coordinator credentials
    if (req.user.role === 'ADMIN' && coordinator_email && coordinator_email.trim()) {
      const email = coordinator_email.trim().toLowerCase();
      const coordName = (coordinator_name && coordinator_name.trim()) || `${targetName} Coordinator`;

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
      message: 'Club details updated successfully.',
      club: {
        id: clubId,
        club_name: targetName,
        description: targetDesc,
        category: validCategory
      }
    });
  } catch (err) {
    console.error('updateClub error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update club: ' + err.message });
  }
}

async function updateClubBaseline(req, res) {
  try {
    const clubId = Number(req.params.id);
    if (!clubId) {
      return res.status(400).json({ success: false, message: 'Valid Club ID is required.' });
    }

    if (req.user.role === 'COORDINATOR' && Number(req.user.club_id) !== clubId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update baseline for your assigned club.' });
    }
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Members have read-only permissions.' });
    }

    const { existing_alumni_count, existing_events_completed_count } = req.body;
    const alumniCount = Math.max(0, Number(existing_alumni_count) || 0);
    const eventsCount = Math.max(0, Number(existing_events_completed_count) || 0);

    const [clubCheck] = await query('SELECT id, club_name FROM clubs WHERE id = ?', [clubId]);
    if (!clubCheck || clubCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    await query(
      'UPDATE clubs SET existing_alumni_count = ?, existing_events_completed_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [alumniCount, eventsCount, clubId]
    );

    return res.status(200).json({
      success: true,
      message: 'Club baseline numbers updated successfully.',
      club_id: clubId,
      existing_alumni_count: alumniCount,
      existing_events_completed_count: eventsCount
    });
  } catch (err) {
    console.error('updateClubBaseline error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update club baseline: ' + err.message });
  }
}

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  updateClubBaseline
};

