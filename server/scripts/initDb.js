
const { getDb, query } = require('../config/db');

async function addColumnIfMissing(table, column, definition) {
  try {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (err) {
    const message = (err.message || '').toLowerCase();

    // Ignore only duplicate-column errors.
    if (
      !message.includes('duplicate column') &&
      !message.includes('column already exists') &&
      !message.includes('duplicate column name')
    ) {
      throw err;
    }
  }
}

async function initDb() {
  console.log('--- Initializing Database Schema ---');
  await getDb();

  // 1. Clubs
  await query(`
    CREATE TABLE IF NOT EXISTS clubs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      club_name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT NULL,
      category VARCHAR(50) DEFAULT 'Technical',
      existing_alumni_count INT NOT NULL DEFAULT 0,
      existing_events_completed_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing(
    'clubs',
    'existing_alumni_count',
    'INT NOT NULL DEFAULT 0'
  );
  await addColumnIfMissing(
    'clubs',
    'existing_events_completed_count',
    'INT NOT NULL DEFAULT 0'
  );

  // 2. Users
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      club_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('users', 'club_id', 'INT NULL');

  // 3. Members
  // CREATE TABLE IF NOT EXISTS will not change an existing table,
  // so explicitly migrate columns needed by the current application.
  await query(`
    CREATE TABLE IF NOT EXISTS members (
      id INT PRIMARY KEY AUTO_INCREMENT,
      club_id INT NULL,
      member_type VARCHAR(50) DEFAULT 'STUDENT',
      name VARCHAR(150) NOT NULL,
      gender VARCHAR(20) NULL,
      dob DATE NULL,
      email VARCHAR(150) NULL,
      phone VARCHAR(20) NULL,
      department VARCHAR(100) NULL,
      year VARCHAR(50) NULL,
      batch VARCHAR(100) NULL,
      company VARCHAR(150) NULL,
      domain VARCHAR(150) NULL,
      position VARCHAR(150) NULL,
      status VARCHAR(50) DEFAULT 'APPROVED',
      role VARCHAR(50) DEFAULT 'MEMBER',
      is_existing INT NOT NULL DEFAULT 0,
      submitted_by INT NULL,
      admin_remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL
    )
  `);

  const memberColumns = [
    ['club_id', 'INT NULL'],
    ['member_type', "VARCHAR(50) DEFAULT 'STUDENT'"],
    ['gender', 'VARCHAR(20) NULL'],
    ['dob', 'DATE NULL'],
    ['email', 'VARCHAR(150) NULL'],
    ['phone', 'VARCHAR(20) NULL'],
    ['department', 'VARCHAR(100) NULL'],
    ['year', 'VARCHAR(50) NULL'],
    ['batch', 'VARCHAR(100) NULL'],
    ['company', 'VARCHAR(150) NULL'],
    ['domain', 'VARCHAR(150) NULL'],
    ['position', 'VARCHAR(150) NULL'],
    ['status', "VARCHAR(50) DEFAULT 'APPROVED'"],
    ['role', "VARCHAR(50) DEFAULT 'MEMBER'"],
    ['is_existing', 'INT NOT NULL DEFAULT 0'],
    ['submitted_by', 'INT NULL'],
    ['admin_remarks', 'TEXT NULL'],
    ['approved_at', 'TIMESTAMP NULL']
  ];

  for (const [column, definition] of memberColumns) {
    await addColumnIfMissing('members', column, definition);
  }

  // 4. Monthly Action Plans
  await query(`
    CREATE TABLE IF NOT EXISTS monthly_action_plans (
      id INT PRIMARY KEY AUTO_INCREMENT,
      club_id INT NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      target_members INT NOT NULL DEFAULT 0,
      target_events INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_club_month_year (club_id, month, year),
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing(
    'monthly_action_plans',
    'target_events',
    'INT NOT NULL DEFAULT 0'
  );

  // 5. Events
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      action_plan_id INT NOT NULL,
      club_id INT NOT NULL,
      event_name VARCHAR(200) NOT NULL,
      event_type VARCHAR(150) NOT NULL,
      event_date DATE NOT NULL,
      event_time VARCHAR(20) NOT NULL,
      venue VARCHAR(200) NOT NULL,
      alumni_details TEXT NULL,
      description TEXT NULL,
      remarks TEXT NULL,
      status VARCHAR(50) DEFAULT 'PLANNED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (action_plan_id)
        REFERENCES monthly_action_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (club_id)
        REFERENCES clubs(id) ON DELETE CASCADE
    )
  `);
  const eventColumns = [
    ['action_plan_id', 'INT NULL'],
    ['club_id', 'INT NULL'],
    ['event_name', 'VARCHAR(200) NULL'],
    ['event_type', 'VARCHAR(150) NULL'],
    ['event_date', 'DATE NULL'],
    ['event_time', 'VARCHAR(20) NULL'],
    ['venue', 'VARCHAR(200) NULL'],
    ['alumni_details', 'TEXT NULL'],
    ['description', 'TEXT NULL'],
    ['remarks', 'TEXT NULL'],
    ['status', "VARCHAR(50) DEFAULT 'PLANNED'"]
  ];

  for (const [column, definition] of eventColumns) {
    await addColumnIfMissing('events', column, definition);
  }

  // 6. Event Reschedules
  await query(`
    CREATE TABLE IF NOT EXISTS event_reschedules (
      id INT PRIMARY KEY AUTO_INCREMENT,
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

  // 7. Event Reports
  await query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT PRIMARY KEY AUTO_INCREMENT,
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

  // Business rule: alumni cannot be coordinators.
  try {
    await query(`
      UPDATE members
      SET role = 'MEMBER'
      WHERE member_type = 'ALUMNI'
        AND role = 'COORDINATOR'
    `);
  } catch (err) {
    if (!err.message?.toLowerCase().includes('unknown column')) {
      throw err;
    }
  }

  console.log('✓ Database schema initialization completed!');
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
