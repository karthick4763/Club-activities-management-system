const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function getMembers(req, res) {
  try {
    const { club_id, status, member_type, month, year, search } = req.query;

    let sql = `
      SELECT 
        m.id, 
        m.club_id, 
        c.club_name,
        m.member_type,
        m.name, 
        m.gender,
        m.dob,
        m.email, 
        m.phone, 
        m.department, 
        m.year, 
        m.batch,
        m.company,
        m.domain,
        m.position,
        m.status,
        m.role, 
        m.admin_remarks, 
        m.created_at, 
        m.approved_at,
        u.name AS submitted_by_name
      FROM members m
      JOIN clubs c ON m.club_id = c.id
      LEFT JOIN users u ON m.submitted_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Role container check (COORDINATOR and MEMBER only see their assigned club)
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      sql += ` AND m.club_id = ?`;
      params.push(req.user.club_id);
    } else if (club_id && club_id !== 'ALL') {
      sql += ` AND m.club_id = ?`;
      params.push(Number(club_id));
    }

    if (member_type && member_type !== 'ALL') {
      sql += ` AND m.member_type = ?`;
      params.push(member_type);
    }

    if (status && status !== 'ALL') {
      sql += ` AND m.status = ?`;
      params.push(status);
    }

    if (year && year !== 'ALL') {
      sql += ` AND (strftime('%Y', m.created_at) = ? OR YEAR(m.created_at) = ?)`;
      params.push(String(year), Number(year));
    }

    if (month && month !== 'ALL') {
      const formattedMonth = String(month).padStart(2, '0');
      sql += ` AND (strftime('%m', m.created_at) = ? OR MONTH(m.created_at) = ?)`;
      params.push(formattedMonth, Number(month));
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim().replace(/[%_]/g, '\\$&');
      const searchWildcard = `%${cleanSearch}%`;
      sql += ` AND (m.name LIKE ? OR m.email LIKE ? OR m.department LIKE ? OR m.batch LIKE ? OR m.company LIKE ? OR m.domain LIKE ? OR m.position LIKE ?)`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    sql += ` ORDER BY m.created_at DESC`;

    const [members] = await query(sql, params);
    return res.status(200).json({ success: true, count: members.length, members });
  } catch (err) {
    console.error('getMembers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch members.' });
  }
}

async function addMember(req, res) {
  try {
    const { 
      member_type = 'STUDENT',
      name, 
      gender,
      dob,
      email, 
      phone, 
      department, 
      year, 
      batch,
      company,
      domain,
      position,
      club_id 
    } = req.body;

    const normalizedType = member_type.toUpperCase() === 'ALUMNI' ? 'ALUMNI' : 'STUDENT';

    if (normalizedType === 'STUDENT') {
      if (!name || !email || !phone || !department || !year) {
        return res.status(400).json({
          success: false,
          message: 'Full Name, Department, Year of Study, Mobile Number, and College Email are required for Student Registration.'
        });
      }
    } else {
      // Alumni
      if (!name || !email || !phone || !batch) {
        return res.status(400).json({
          success: false,
          message: 'Full Name, Email Address, Mobile Phone No., and Batch are required for Alumni Registration.'
        });
      }
    }

    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    // Determine target club
    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR') {
      targetClubId = req.user.club_id;
    }

    if (!targetClubId) {
      return res.status(400).json({ success: false, message: 'Club ID is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const phoneSuffix = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    // Global security check: Email cannot belong to an Admin or Coordinator
    const [existingUser] = await query('SELECT id, email, role, club_id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser && existingUser.length > 0) {
      if (existingUser[0].role === 'ADMIN' || existingUser[0].role === 'COORDINATOR') {
        return res.status(400).json({
          success: false,
          message: 'This email address is already associated with an administrator or club coordinator account.'
        });
      }
      if (Number(existingUser[0].club_id) !== Number(targetClubId)) {
        return res.status(400).json({
          success: false,
          message: 'This email address is already registered with another club.'
        });
      }
    }

    // 1. Strict Duplicate Check by Email across all clubs
    const [existingMemberEmail] = await query(
      `SELECT m.id, m.name, m.email, m.member_type, m.status, c.club_name 
       FROM members m 
       JOIN clubs c ON m.club_id = c.id 
       WHERE LOWER(m.email) = ?`,
      [cleanEmail]
    );

    if (existingMemberEmail && existingMemberEmail.length > 0) {
      const match = existingMemberEmail[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate record: A member with email "${cleanEmail}" is already registered in ${match.club_name} (${match.name}, ${match.member_type}, Status: ${match.status}).`
      });
    }

    // 2. Strict Duplicate Check by Phone Number across all clubs
    if (phoneSuffix.length >= 7) {
      const [existingMemberPhone] = await query(
        `SELECT m.id, m.name, m.phone, m.member_type, m.status, c.club_name 
         FROM members m 
         JOIN clubs c ON m.club_id = c.id 
         WHERE m.phone LIKE ?`,
        [`%${phoneSuffix}%`]
      );

      if (existingMemberPhone && existingMemberPhone.length > 0) {
        const match = existingMemberPhone[0];
        return res.status(400).json({
          success: false,
          message: `Duplicate record: Phone number (${phone.trim()}) is already registered for "${match.name}" in ${match.club_name} (${match.member_type}).`
        });
      }
    }

    // 3. Duplicate Check by Name within the target club
    if (normalizedType === 'STUDENT') {
      const [existingStudent] = await query(
        `SELECT id, name, department, year FROM members 
         WHERE club_id = ? AND member_type = 'STUDENT' AND LOWER(name) = ? AND LOWER(department) = ?`,
        [targetClubId, name.trim().toLowerCase(), department.trim().toLowerCase()]
      );
      if (existingStudent && existingStudent.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Duplicate record: A student named "${name.trim()}" in Department ${department.trim()} is already enrolled in this club.`
        });
      }
    } else {
      const [existingAlumni] = await query(
        `SELECT id, name, batch FROM members 
         WHERE club_id = ? AND member_type = 'ALUMNI' AND LOWER(name) = ? AND LOWER(batch) = ?`,
        [targetClubId, name.trim().toLowerCase(), batch.trim().toLowerCase()]
      );
      if (existingAlumni && existingAlumni.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Duplicate record: An alumni member named "${name.trim()}" (${batch.trim()}) is already enrolled in this club.`
        });
      }
    }

    // Students are Auto-Approved; Alumni require Admin Approval (PENDING)
    const initialStatus = normalizedType === 'STUDENT' ? 'APPROVED' : 'PENDING';

    const [result] = await query(
      `INSERT INTO members (club_id, member_type, name, gender, dob, email, phone, department, year, batch, company, domain, position, status, role, submitted_by, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetClubId,
        normalizedType,
        name.trim(),
        gender || null,
        dob || null,
        cleanEmail,
        phone.trim(),
        department ? department.trim() : null,
        year ? year.trim() : null,
        batch ? batch.trim() : null,
        company ? company.trim() : null,
        domain ? domain.trim() : null,
        position ? position.trim() : null,
        initialStatus,
        'MEMBER',
        req.user.id,
        initialStatus === 'APPROVED' ? new Date() : null
      ]
    );

    // Create / ensure corresponding login account in users table if not already existing
    if (!existingUser || existingUser.length === 0) {
      const defaultMemberPassword = await bcrypt.hash('Member@123', 10);
      await query(
        `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)`,
        [name.trim(), cleanEmail, defaultMemberPassword, 'MEMBER', targetClubId]
      );
    }

    const successMessage = normalizedType === 'STUDENT'
      ? 'Student member registered and auto-approved successfully.'
      : 'Alumni member registered successfully. Awaiting Admin verification & approval.';

    return res.status(201).json({
      success: true,
      message: successMessage,
      memberId: result.insertId,
      status: initialStatus,
      member_type: normalizedType,
      role: 'MEMBER'
    });
  } catch (err) {
    console.error('addMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register member.' });
  }
}

async function bulkAddMembers(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const { members = [], club_id } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'No member records provided in request payload.' });
    }

    // Determine target club
    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR') {
      targetClubId = req.user.club_id;
    }

    if (!targetClubId) {
      return res.status(400).json({ success: false, message: 'Club ID is required.' });
    }

    // Fetch all existing members across the system to prevent duplicate emails and duplicate phone numbers
    const [allExistingMembers] = await query(`
      SELECT m.id, m.name, m.email, m.phone, m.member_type, m.club_id, c.club_name 
      FROM members m 
      JOIN clubs c ON m.club_id = c.id
    `);

    const existingEmailsMap = new Map();
    const existingPhonesMap = new Map();
    const existingStudentKeys = new Set();
    const existingAlumniKeys = new Set();

    allExistingMembers.forEach(m => {
      if (m.email) existingEmailsMap.set(m.email.toLowerCase().trim(), m);
      if (m.phone) {
        const pClean = m.phone.replace(/[^0-9]/g, '').slice(-10);
        if (pClean.length >= 7) existingPhonesMap.set(pClean, m);
      }
      if (m.member_type === 'STUDENT' && m.name) {
        existingStudentKeys.add(`${m.club_id}:${m.name.toLowerCase().trim()}`);
      }
      if (m.member_type === 'ALUMNI' && m.name) {
        existingAlumniKeys.add(`${m.club_id}:${m.name.toLowerCase().trim()}`);
      }
    });

    // Fetch existing users across the system to protect admin/coordinator emails and foreign club members
    const [allUsers] = await query('SELECT id, email, role, club_id FROM users');
    const systemUserMap = new Map();
    allUsers.forEach(u => systemUserMap.set((u.email || '').toLowerCase().trim(), u));

    const defaultMemberPassword = await bcrypt.hash('Member@123', 10);

    const inserted = [];
    const skipped = [];
    const processedEmailsInBatch = new Set();
    const processedPhonesInBatch = new Set();

    for (let i = 0; i < members.length; i++) {
      const row = members[i];
      const rawName = (row.name || row.Name || row['Full Name'] || '').toString().trim();
      const rawEmail = (row.email || row.Email || row['Email Address'] || row['College Email'] || '').toString().trim().toLowerCase();
      const rawPhone = (row.phone || row.Phone || row.mobile || row.Mobile || row['Phone Number'] || row['Mobile Phone No'] || '').toString().trim();
      const rawType = (row.member_type || row.type || row.Type || row['Member Type'] || 'STUDENT').toString().trim().toUpperCase();
      const normalizedType = rawType === 'ALUMNI' ? 'ALUMNI' : 'STUDENT';
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);

      // Validation
      if (!rawName) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Missing Name' });
        continue;
      }
      if (!rawEmail || !rawEmail.includes('@')) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Invalid or missing Email address' });
        continue;
      }
      if (!rawPhone || cleanPhone.length < 7) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Missing or invalid Phone number' });
        continue;
      }

      // Check duplicate email within this upload batch
      if (processedEmailsInBatch.has(rawEmail)) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Duplicate email inside this upload file' });
        continue;
      }

      // Check duplicate phone within this upload batch
      if (processedPhonesInBatch.has(cleanPhone)) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: `Duplicate phone number (${rawPhone}) inside this upload file` });
        continue;
      }

      // Check duplicate email across database
      if (existingEmailsMap.has(rawEmail)) {
        const match = existingEmailsMap.get(rawEmail);
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: `Already registered: Email belongs to ${match.name} (${match.member_type} in ${match.club_name})` });
        continue;
      }

      // Check duplicate phone across database
      if (existingPhonesMap.has(cleanPhone)) {
        const match = existingPhonesMap.get(cleanPhone);
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: `Already registered: Phone belongs to ${match.name} (${match.member_type} in ${match.club_name})` });
        continue;
      }

      // Check duplicate name within the target club
      if (normalizedType === 'STUDENT') {
        const studentKey = `${targetClubId}:${rawName.toLowerCase()}`;
        if (existingStudentKeys.has(studentKey)) {
          skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: `Duplicate student: "${rawName}" is already enrolled in this club` });
          continue;
        }
      } else {
        const alumniKey = `${targetClubId}:${rawName.toLowerCase()}`;
        if (existingAlumniKeys.has(alumniKey)) {
          skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: `Duplicate alumni: "${rawName}" is already enrolled in this club` });
          continue;
        }
      }

      // Security check: email belongs to admin or other club
      const existingUser = systemUserMap.get(rawEmail);
      if (existingUser) {
        if (existingUser.role === 'ADMIN' || existingUser.role === 'COORDINATOR') {
          skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Email belongs to an Admin or Coordinator' });
          continue;
        }
        if (Number(existingUser.club_id) !== Number(targetClubId)) {
          skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: 'Email already registered with another club' });
          continue;
        }
      }

      // Extract specific fields
      let department = null;
      let year = null;
      let batch = null;
      let company = null;
      let domain = null;
      let position = null;
      let gender = (row.gender || row.Gender || null)?.toString().trim() || null;
      let dob = (row.dob || row.DOB || row['Date of Birth'] || null)?.toString().trim() || null;

      if (normalizedType === 'STUDENT') {
        department = (row.department || row.Department || row.dept || row.Dept || 'CSE').toString().trim();
        year = (row.year || row.Year || row['Year of Study'] || '1st Year').toString().trim();
      } else {
        batch = (row.batch || row.Batch || row['Graduation Batch'] || 'Alumni').toString().trim();
        company = (row.company || row.Company || row.organization || row.Organization || null)?.toString().trim() || null;
        domain = (row.domain || row.Domain || row.industry || row.Industry || null)?.toString().trim() || null;
        position = (row.position || row.Position || row.designation || row.Designation || row.role_title || null)?.toString().trim() || null;
      }

      const initialStatus = normalizedType === 'STUDENT' ? 'APPROVED' : 'PENDING';
      const approvedAt = initialStatus === 'APPROVED' ? new Date() : null;

      try {
        const [insertRes] = await query(
          `INSERT INTO members (club_id, member_type, name, gender, dob, email, phone, department, year, batch, company, domain, position, status, role, submitted_by, approved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            targetClubId,
            normalizedType,
            rawName,
            gender,
            dob,
            rawEmail,
            rawPhone,
            department,
            year,
            batch,
            company,
            domain,
            position,
            initialStatus,
            'MEMBER',
            req.user.id,
            approvedAt
          ]
        );

        // Auto-create user login credential if doesn't exist
        if (!existingUser) {
          await query(
            `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)`,
            [rawName, rawEmail, defaultMemberPassword, 'MEMBER', targetClubId]
          );
          systemUserMap.set(rawEmail, { email: rawEmail, role: 'MEMBER', club_id: targetClubId });
        }

        processedEmailsInBatch.add(rawEmail);
        processedPhonesInBatch.add(cleanPhone);
        existingEmailsMap.set(rawEmail, { name: rawName, member_type: normalizedType, club_name: 'Current Club' });
        existingPhonesMap.set(cleanPhone, { name: rawName, member_type: normalizedType, club_name: 'Current Club' });
        if (normalizedType === 'STUDENT') {
          existingStudentKeys.add(`${targetClubId}:${rawName.toLowerCase()}`);
        } else {
          existingAlumniKeys.add(`${targetClubId}:${rawName.toLowerCase()}`);
        }

        inserted.push({
          id: insertRes.insertId,
          name: rawName,
          email: rawEmail,
          member_type: normalizedType,
          status: initialStatus
        });
      } catch (insertErr) {
        skipped.push({ row: i + 1, name: rawName, email: rawEmail, reason: insertErr.message || 'Database insert error' });
      }
    }

    const message = `Processed ${members.length} records: ${inserted.length} imported successfully, ${skipped.length} skipped.`;

    return res.status(200).json({
      success: true,
      message,
      importedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped
    });
  } catch (err) {
    console.error('bulkAddMembers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process bulk member import.' });
  }
}

async function approveMember(req, res) {
  try {
    const memberId = req.params.id;
    const [members] = await query('SELECT * FROM members WHERE id = ?', [memberId]);

    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await query(
      `UPDATE members 
       SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP, admin_remarks = NULL 
       WHERE id = ?`,
      [memberId]
    );

    return res.status(200).json({
      success: true,
      message: `Member "${members[0].name}" approved successfully.`
    });
  } catch (err) {
    console.error('approveMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve member.' });
  }
}

async function rejectMember(req, res) {
  try {
    const memberId = req.params.id;
    const { remarks } = req.body;

    const [members] = await query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await query(
      `UPDATE members 
       SET status = 'REJECTED', admin_remarks = ? 
       WHERE id = ?`,
      [remarks || 'Rejected by administrator', memberId]
    );

    return res.status(200).json({
      success: true,
      message: `Member "${members[0].name}" rejected with remarks recorded.`
    });
  } catch (err) {
    console.error('rejectMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject member.' });
  }
}

async function toggleMemberRole(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only Coordinators or Admins can promote/demote members.' });
    }

    const memberId = req.params.id;
    const { role } = req.body; // 'COORDINATOR' or 'MEMBER'

    const targetRole = role === 'COORDINATOR' ? 'COORDINATOR' : 'MEMBER';

    const [members] = await query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const member = members[0];
    if (req.user.role === 'COORDINATOR' && Number(member.club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only manage members within your assigned club.' });
    }

    // Business Rule: ONLY student members can become coordinator, NO alumni can become coordinator
    if (targetRole === 'COORDINATOR' && member.member_type !== 'STUDENT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only student members can become coordinator. Alumni members cannot become coordinator.' 
      });
    }

    // Ensure target user cannot be an ADMIN or coordinator of another club
    const [targetUser] = await query('SELECT id, role, club_id FROM users WHERE email = ?', [member.email.toLowerCase()]);
    if (targetUser && targetUser.length > 0) {
      if (targetUser[0].role === 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden. Administrator accounts cannot be modified.' });
      }
      if (targetUser[0].role === 'COORDINATOR' && Number(targetUser[0].club_id) !== Number(member.club_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden. You cannot modify coordinators of other clubs.' });
      }
    }

    // Update in members table
    await query('UPDATE members SET role = ? WHERE id = ?', [targetRole, memberId]);

    // Update in users table for this club
    await query('UPDATE users SET role = ? WHERE email = ? AND (club_id = ? OR club_id IS NULL) AND role != ?', [targetRole, member.email.toLowerCase(), member.club_id, 'ADMIN']);

    const actionText = targetRole === 'COORDINATOR' ? 'promoted to Coordinator' : 'changed to Member';
    return res.status(200).json({
      success: true,
      message: `Member "${member.name}" successfully ${actionText}.`,
      role: targetRole
    });
  } catch (err) {
    console.error('toggleMemberRole error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change member role.' });
  }
}

async function deleteMember(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const memberId = req.params.id;
    const [members] = await query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (req.user.role === 'COORDINATOR' && Number(members[0].club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only remove members from your club.' });
    }

    await query('DELETE FROM members WHERE id = ?', [memberId]);
    // Only delete from users table if the user belongs to this club and is not an ADMIN
    await query(
      'DELETE FROM users WHERE email = ? AND club_id = ? AND role != ?',
      [members[0].email.toLowerCase(), members[0].club_id, 'ADMIN']
    );

    return res.status(200).json({ success: true, message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('deleteMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete member.' });
  }
}

async function updateMemberStatus(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const memberId = req.params.id;
    const { status, remarks } = req.body;

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be PENDING, APPROVED, or REJECTED.' });
    }

    const [members] = await query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!members || members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    let sql = 'UPDATE members SET status = ?';
    const params = [status];

    if (status === 'APPROVED') {
      sql += ', approved_at = CURRENT_TIMESTAMP, admin_remarks = NULL';
    } else if (status === 'REJECTED') {
      sql += ', admin_remarks = ?';
      params.push(remarks || 'Rejected by administrator');
    } else {
      sql += ', approved_at = NULL, admin_remarks = NULL';
    }

    sql += ' WHERE id = ?';
    params.push(memberId);

    await query(sql, params);

    return res.status(200).json({
      success: true,
      message: `Member status updated to ${status}.`
    });
  } catch (err) {
    console.error('updateMemberStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update member status.' });
  }
}

module.exports = {
  getMembers,
  addMember,
  bulkAddMembers,
  approveMember,
  rejectMember,
  toggleMemberRole,
  updateMemberStatus,
  deleteMember
};
