const { getDb, query } = require('../config/db');

async function initDb() {
  console.log('--- Initializing Database Schema ---');
  await getDb();

  // 1. Clubs Table (Only Technical or Non-Technical)
  await query(`
    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      club_name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT,
      category VARCHAR(50) DEFAULT 'Technical', -- Strictly 'Technical' or 'Non-Technical'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Users Table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL, -- ADMIN or COORDINATOR
      club_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
    )
  `);

  // 3. Members Table (Supports Student and Alumni members)
  await query(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      club_id INT NOT NULL,
      member_type VARCHAR(50) DEFAULT 'STUDENT', -- 'STUDENT' or 'ALUMNI'
      name VARCHAR(150) NOT NULL,
      gender VARCHAR(20) NULL, -- 'Male', 'Female', 'Other'
      dob DATE NULL, -- Date of Birth for Alumni
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      department VARCHAR(100) NULL, -- for Students (e.g. CSE, IT, ECE)
      year VARCHAR(50) NULL, -- Year of Study for Students (e.g. 1st Year, 2nd Year, 3rd Year, 4th Year)
      batch VARCHAR(100) NULL, -- Batch for Alumni (e.g. BE 1996, CSE)
      company VARCHAR(150) NULL, -- Company / Organization for Alumni
      domain VARCHAR(150) NULL, -- Working Domain / Industry for Alumni
      position VARCHAR(150) NULL, -- Job Position / Designation for Alumni
      status VARCHAR(50) DEFAULT 'APPROVED', -- 'APPROVED' (default for Students), 'PENDING' (default for Alumni), 'REJECTED'
      role VARCHAR(50) DEFAULT 'MEMBER', -- 'MEMBER' or 'COORDINATOR'
      submitted_by INT NOT NULL,
      admin_remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Schema migrations for new Alumni fields
  try {
    await query('ALTER TABLE members ADD COLUMN company VARCHAR(150) NULL');
  } catch (e) {
    // Column may already exist
  }
  try {
    await query('ALTER TABLE members ADD COLUMN domain VARCHAR(150) NULL');
  } catch (e) {
    // Column may already exist
  }
  try {
    await query('ALTER TABLE members ADD COLUMN position VARCHAR(150) NULL');
  } catch (e) {
    // Column may already exist
  }

  // 4. Monthly Action Plans Table
  await query(`
    CREATE TABLE IF NOT EXISTS monthly_action_plans (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      club_id INT NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      target_members INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (club_id, month, year),
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    )
  `);

  // 5. Events Table with remarks and completion status
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      action_plan_id INT NOT NULL,
      club_id INT NOT NULL,
      event_name VARCHAR(200) NOT NULL,
      event_type VARCHAR(150) NOT NULL, -- Custom text typed by coordinator
      event_date DATE NOT NULL,
      event_time VARCHAR(20) NOT NULL,
      venue VARCHAR(200) NOT NULL,
      alumni_details TEXT NULL,
      description TEXT NULL,
      remarks TEXT NULL, -- Remarks for event
      status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, ONGOING, COMPLETED, RESCHEDULED, CANCELLED
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (action_plan_id) REFERENCES monthly_action_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    )
  `);

  // 6. Event Reschedules Table
  await query(`
    CREATE TABLE IF NOT EXISTS event_reschedules (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      old_date DATE NOT NULL,
      old_time VARCHAR(20) NOT NULL,
      new_date DATE NOT NULL,
      new_time VARCHAR(20) NOT NULL,
      reason TEXT NOT NULL,
      rescheduled_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (rescheduled_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 7. Event Reports Table
  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL UNIQUE,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      file_size INT NOT NULL,
      description TEXT NULL,
      uploaded_by INT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Business rule: Only student members can become coordinator, no alumni can become coordinator
  await query(`UPDATE members SET role = 'MEMBER' WHERE member_type = 'ALUMNI' AND role = 'COORDINATOR'`);

  console.log('✓ All database tables successfully initialized!');
}

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = initDb;
