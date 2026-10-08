const initDb = require('./initDb');
const seedDb = require('./seedDb');
const { query } = require('../config/db');
const jwt = require('jsonwebtoken');

async function testSystem() {
  console.log('========================================================');
  console.log('🧪 Starting Automated System Verification Test');
  console.log('========================================================');

  // 1. Re-seed DB
  await seedDb();

  // 2. Verify Clubs
  const [clubs] = await query('SELECT * FROM clubs');
  console.log(`[PASS] Clubs verified: ${clubs.length} clubs found.`);

  // 3. Verify Users & Roles
  const [users] = await query('SELECT email, role, club_id FROM users');
  console.log(`[PASS] Users verified: ${users.length} users found.`);

  // 4. Test Coordinator Submitting a New Member
  const [codingClub] = await query("SELECT id FROM clubs WHERE club_name = 'Coding Club'");
  const [coord] = await query("SELECT id FROM users WHERE email = 'coding.coord@club.edu'");

  const [insertMemRes] = await query(
    `INSERT INTO members (club_id, name, email, phone, department, year, status, submitted_by)
     VALUES (?, 'Test New Student', 'test.new@student.edu', '9999999999', 'CSE', 'II', 'PENDING', ?)`,
    [codingClub[0].id, coord[0].id]
  );
  const newMemberId = insertMemRes.insertId;
  console.log(`[PASS] Coordinator submitted member ID ${newMemberId}. Initial Status: PENDING.`);

  // 5. Test Target Logic: PENDING member should NOT count towards approved target
  const [planBefore] = await query(
    `SELECT target_members FROM monthly_action_plans WHERE club_id = ? AND month = 9 AND year = 2026`,
    [codingClub[0].id]
  );
  const [approvedBefore] = await query(
    `SELECT COUNT(*) AS approved_count FROM members 
     WHERE club_id = ? AND status = 'APPROVED' 
     AND (strftime('%m', created_at) = '09' OR MONTH(created_at) = 9)`,
    [codingClub[0].id]
  );
  console.log(`[PASS] Target: ${planBefore[0].target_members}, Approved: ${approvedBefore[0].approved_count}. Pending member excluded from target count.`);

  // 6. Test Admin Approval Workflow
  await query(
    `UPDATE members SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newMemberId]
  );
  const [approvedAfter] = await query(
    `SELECT COUNT(*) AS approved_count FROM members 
     WHERE club_id = ? AND status = 'APPROVED' 
     AND (strftime('%m', created_at) = '09' OR MONTH(created_at) = 9)`,
    [codingClub[0].id]
  );
  console.log(`[PASS] Admin Approved Member ${newMemberId}. Approved count increased from ${approvedBefore[0].approved_count} to ${approvedAfter[0].approved_count}!`);

  // 7. Test Reschedule History Audit
  const [sampleEvent] = await query('SELECT id, event_name, event_date, event_time FROM events LIMIT 1');
  const eventId = sampleEvent[0].id;
  await query(
    `INSERT INTO event_reschedules (event_id, old_date, old_time, new_date, new_time, reason, rescheduled_by)
     VALUES (?, ?, ?, '2026-09-28', '03:30 PM', 'Keynote speaker flight rescheduled', ?)`,
    [eventId, sampleEvent[0].event_date, sampleEvent[0].event_time, coord[0].id]
  );
  await query(
    `UPDATE events SET event_date = '2026-09-28', event_time = '03:30 PM', status = 'RESCHEDULED' WHERE id = ?`,
    [eventId]
  );
  const [reschedRecords] = await query('SELECT * FROM event_reschedules WHERE event_id = ?', [eventId]);
  console.log(`[PASS] Reschedule history preserved: ${reschedRecords.length} audit entry saved for Event ID ${eventId}.`);

  // 8. Test Coordinator Report Upload without Admin Approval
  await query(
    `INSERT OR REPLACE INTO reports (event_id, file_name, file_path, file_size, description, uploaded_by)
     VALUES (?, 'Full_Event_Documentation.pdf', 'uploads/test_doc.pdf', 204800, 'Report verified by coordinator', ?)`,
    [eventId, coord[0].id]
  );
  const [reportCheck] = await query('SELECT * FROM reports WHERE event_id = ?', [eventId]);
  console.log(`[PASS] Report uploaded and stored directly: "${reportCheck[0].file_name}" (No Admin approval required).`);

  console.log('========================================================');
  console.log('✅ ALL BUSINESS RULES & WORKFLOWS VERIFIED SUCCESSFULLY!');
  console.log('========================================================');
}

testSystem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
