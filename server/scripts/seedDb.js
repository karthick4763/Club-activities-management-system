const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const initDb = require('./initDb');

async function seedDb() {
  console.log('--- Starting Database Seeding ---');

  // Drop existing tables in reverse dependency order for clean state
  try {
    await query('DROP TABLE IF EXISTS reports');
    await query('DROP TABLE IF EXISTS event_reschedules');
    await query('DROP TABLE IF EXISTS events');
    await query('DROP TABLE IF EXISTS monthly_action_plans');
    await query('DROP TABLE IF EXISTS members');
    await query('DROP TABLE IF EXISTS users');
    await query('DROP TABLE IF EXISTS clubs');
  } catch (e) {
    console.log('Notice during table cleanup:', e.message);
  }

  await initDb();

  // 1. Seed the 5 Target Clubs (AI, IT, Electronics, Auto, Entrepreneurship)
  const clubs = [
    { name: 'AI Club', desc: 'Artificial intelligence, machine learning, data intelligence, deep neural networks, and computer vision.', cat: 'Technical' },
    { name: 'IT Club', desc: 'Full-stack software engineering, cloud systems, web platforms, cybersecurity, and DevOps architectures.', cat: 'Technical' },
    { name: 'Electronics Club', desc: 'Embedded systems, microcontrollers, Internet of Things (IoT), circuit design, robotics, and sensors.', cat: 'Technical' },
    { name: 'Auto Club', desc: 'Automotive innovation, electric vehicles, CAD modeling, autonomous mobility, and mechanical systems.', cat: 'Technical' },
    { name: 'Entrepreneurship Club', desc: 'Startup incubation, venture capital, business modeling, pitching, and student enterprise.', cat: 'Non-Technical' }
  ];

  const clubIds = {};
  for (const c of clubs) {
    const [res] = await query(
      'INSERT INTO clubs (club_name, description, category) VALUES (?, ?, ?)',
      [c.name, c.desc, c.cat]
    );
    clubIds[c.name] = res.insertId;
  }
  console.log('✓ Clubs seeded (AI, IT, Electronics, Auto, Entrepreneurship):', clubIds);

  // 2. Seed Users (Admin & 5 Club Coordinators)
  const defaultPassword = await bcrypt.hash('Admin@123', 10);
  const coordPassword = await bcrypt.hash('Coord@123', 10);

  // Admin
  const [adminRes] = await query(
    'INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, NULL)',
    ['System Administrator', 'admin@club.edu', defaultPassword, 'ADMIN']
  );
  const adminId = adminRes.insertId;

  // Coordinators
  const coordinators = [
    { name: 'Dr. Sarah Chen (AI Club Coord)', email: 'ai.coord@club.edu', clubId: clubIds['AI Club'] },
    { name: 'Alex Rivera (IT Club Coord)', email: 'it.coord@club.edu', clubId: clubIds['IT Club'] },
    { name: 'Prof. Rajesh Nair (Electronics Coord)', email: 'electronics.coord@club.edu', clubId: clubIds['Electronics Club'] },
    { name: 'Marcus Vance (Auto Club Coord)', email: 'auto.coord@club.edu', clubId: clubIds['Auto Club'] },
    { name: 'Prof. Vikram Malhotra (Entrepreneur Coord)', email: 'entrepreneur.coord@club.edu', clubId: clubIds['Entrepreneurship Club'] }
  ];

  const coordIds = {};
  for (const coord of coordinators) {
    const [cRes] = await query(
      'INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)',
      [coord.name, coord.email, coordPassword, 'COORDINATOR', coord.clubId]
    );
    coordIds[coord.email] = cRes.insertId;
  }
  console.log('✓ Users seeded (1 Admin, 5 Club Coordinators)');

  // 3. Seed Monthly Action Plans for September 2026 (Month 9, Year 2026) - Alumni Outreach Targets
  const currentMonth = 9;
  const currentYear = 2026;

  const planIds = {};
  const plans = [
    { clubId: clubIds['AI Club'], target: 5 },
    { clubId: clubIds['IT Club'], target: 8 },
    { clubId: clubIds['Electronics Club'], target: 6 },
    { clubId: clubIds['Auto Club'], target: 4 },
    { clubId: clubIds['Entrepreneurship Club'], target: 5 }
  ];

  for (const p of plans) {
    const [pRes] = await query(
      'INSERT INTO monthly_action_plans (club_id, month, year, target_members) VALUES (?, ?, ?, ?)',
      [p.clubId, currentMonth, currentYear, p.target]
    );
    planIds[p.clubId] = pRes.insertId;
  }
  console.log('✓ Monthly Action Plans seeded for September 2026 (Alumni Targets)');

  // 4. Seed Members (Student Members: Auto-Approved; Alumni Members: Verified/Approved or Pending)
  const members = [
    // AI Club - Students (Auto-Approved)
    { clubId: clubIds['AI Club'], type: 'STUDENT', name: 'Rahul Sharma', email: 'rahul.s@student.edu', phone: '9876543210', dept: 'AI&DS', year: '3rd Year', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-02 09:00:00' },
    { clubId: clubIds['AI Club'], type: 'STUDENT', name: 'Pooja Verma', email: 'pooja.v@student.edu', phone: '9876543211', dept: 'CSE', year: '2nd Year', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-05 11:00:00' },
    { clubId: clubIds['AI Club'], type: 'STUDENT', name: 'Anish Roy', email: 'anish.r@student.edu', phone: '9876543212', dept: 'IT', year: '1st Year', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-08-20 14:00:00' },
    // AI Club - Alumni (Targets: 5, 3 Approved, 1 Pending)
    { clubId: clubIds['AI Club'], type: 'ALUMNI', name: 'Velayutham R.', email: 'rsvel_kumar@yahoo.co.uk', phone: '9486676252', gender: 'Male', dob: '1974-03-09', batch: 'BE 1996, CSE', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-03 10:00:00' },
    { clubId: clubIds['AI Club'], type: 'ALUMNI', name: 'Kavitha Sundaram', email: 'kavitha.s@alum.edu', phone: '9486676253', gender: 'Female', dob: '1982-07-14', batch: 'BE 2004, ECE', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-06 12:00:00' },
    { clubId: clubIds['AI Club'], type: 'ALUMNI', name: 'Srinivasan M.', email: 'srini.m@techlead.com', phone: '9486676254', gender: 'Male', dob: '1988-11-20', batch: 'B.Tech 2010, IT', status: 'APPROVED', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-09 15:00:00' },
    { clubId: clubIds['AI Club'], type: 'ALUMNI', name: 'Divya Narayanan', email: 'divya.n@alum.edu', phone: '9486676255', gender: 'Female', dob: '1995-04-18', batch: 'BE 2017, CSE', status: 'PENDING', subBy: coordIds['ai.coord@club.edu'], createdAt: '2026-09-11 16:00:00' },

    // IT Club - Students (Auto-Approved)
    { clubId: clubIds['IT Club'], type: 'STUDENT', name: 'Arun Kumar', email: 'arun.k@student.edu', phone: '9876543220', dept: 'IT', year: '3rd Year', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-03 09:30:00' },
    { clubId: clubIds['IT Club'], type: 'STUDENT', name: 'Priya Sharma', email: 'priya.s@student.edu', phone: '9876543221', dept: 'CSE', year: '2nd Year', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-08-18 10:00:00' },
    // IT Club - Alumni (Target: 8, 4 Approved, 2 Pending)
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Manish Gupta', email: 'manish.g@alum.edu', phone: '9486676260', gender: 'Male', dob: '1980-05-12', batch: 'BE 2002, IT', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-04 11:00:00' },
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Rekha Menon', email: 'rekha.m@alum.edu', phone: '9486676261', gender: 'Female', dob: '1985-09-22', batch: 'BE 2007, CSE', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-07 14:00:00' },
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Sanjay Dutt', email: 'sanjay.d@alum.edu', phone: '9486676262', gender: 'Male', dob: '1990-01-30', batch: 'BE 2012, IT', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-10 16:00:00' },
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Anita Desai', email: 'anita.d@alum.edu', phone: '9486676263', gender: 'Female', dob: '1992-08-15', batch: 'BE 2014, CSE', status: 'APPROVED', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-12 17:00:00' },
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Gautam Singhania', email: 'gautam.s@alum.edu', phone: '9486676264', gender: 'Male', dob: '1996-12-05', batch: 'BE 2018, IT', status: 'PENDING', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-13 18:00:00' },
    { clubId: clubIds['IT Club'], type: 'ALUMNI', name: 'Meera Nambiar', email: 'meera.n@alum.edu', phone: '9486676265', gender: 'Female', dob: '1998-03-25', batch: 'BE 2020, CSE', status: 'PENDING', subBy: coordIds['it.coord@club.edu'], createdAt: '2026-09-14 19:00:00' },

    // Electronics Club - Students (Auto-Approved)
    { clubId: clubIds['Electronics Club'], type: 'STUDENT', name: 'Karthik Raja', email: 'karthik.r@student.edu', phone: '9876543230', dept: 'ECE', year: '3rd Year', status: 'APPROVED', subBy: coordIds['electronics.coord@club.edu'], createdAt: '2026-09-01 10:00:00' },
    // Electronics Club - Alumni (Target: 6, 3 Approved, 1 Pending)
    { clubId: clubIds['Electronics Club'], type: 'ALUMNI', name: 'Balamurugan T.', email: 'bala.t@alum.edu', phone: '9486676270', gender: 'Male', dob: '1978-02-14', batch: 'BE 2000, ECE', status: 'APPROVED', subBy: coordIds['electronics.coord@club.edu'], createdAt: '2026-09-02 11:00:00' },
    { clubId: clubIds['Electronics Club'], type: 'ALUMNI', name: 'Geetha Swaminathan', email: 'geetha.s@alum.edu', phone: '9486676271', gender: 'Female', dob: '1984-10-10', batch: 'BE 2006, EEE', status: 'APPROVED', subBy: coordIds['electronics.coord@club.edu'], createdAt: '2026-08-22 14:00:00' },
    { clubId: clubIds['Electronics Club'], type: 'ALUMNI', name: 'Naveen Kumar', email: 'naveen.k@alum.edu', phone: '9486676272', gender: 'Male', dob: '1991-06-19', batch: 'BE 2013, ECE', status: 'APPROVED', subBy: coordIds['electronics.coord@club.edu'], createdAt: '2026-09-05 15:00:00' },
    { clubId: clubIds['Electronics Club'], type: 'ALUMNI', name: 'Preeti Rao', email: 'preeti.r@alum.edu', phone: '9486676273', gender: 'Female', dob: '1997-09-02', batch: 'BE 2019, ECE', status: 'PENDING', subBy: coordIds['electronics.coord@club.edu'], createdAt: '2026-09-12 16:30:00' },

    // Auto Club - Students (Auto-Approved)
    { clubId: clubIds['Auto Club'], type: 'STUDENT', name: 'Vigneshwaran P.', email: 'vignesh.p@student.edu', phone: '9876543240', dept: 'MECH', year: '4th Year', status: 'APPROVED', subBy: coordIds['auto.coord@club.edu'], createdAt: '2026-09-04 10:00:00' },
    // Auto Club - Alumni (Target: 4, 2 Approved, 1 Pending)
    { clubId: clubIds['Auto Club'], type: 'ALUMNI', name: 'Senthil Nathan', email: 'senthil.n@alum.edu', phone: '9486676280', gender: 'Male', dob: '1983-11-15', batch: 'BE 2005, MECH', status: 'APPROVED', subBy: coordIds['auto.coord@club.edu'], createdAt: '2026-09-06 11:00:00' },
    { clubId: clubIds['Auto Club'], type: 'ALUMNI', name: 'Arvind Swamy', email: 'arvind.s@alum.edu', phone: '9486676281', gender: 'Male', dob: '1989-04-20', batch: 'BE 2011, AUTO', status: 'APPROVED', subBy: coordIds['auto.coord@club.edu'], createdAt: '2026-08-15 13:00:00' },
    { clubId: clubIds['Auto Club'], type: 'ALUMNI', name: 'Rohit Kulkarni', email: 'rohit.k@alum.edu', phone: '9486676282', gender: 'Male', dob: '1994-08-30', batch: 'BE 2016, MECH', status: 'PENDING', subBy: coordIds['auto.coord@club.edu'], createdAt: '2026-09-10 15:00:00' },

    // Entrepreneurship Club - Students (Auto-Approved)
    { clubId: clubIds['Entrepreneurship Club'], type: 'STUDENT', name: 'Tanvi Shah', email: 'tanvi.s@student.edu', phone: '9876543250', dept: 'MBA', year: '1st Year', status: 'APPROVED', subBy: coordIds['entrepreneur.coord@club.edu'], createdAt: '2026-09-02 10:00:00' },
    { clubId: clubIds['Entrepreneurship Club'], type: 'STUDENT', name: 'Rohan Mehra', email: 'rohan.m@student.edu', phone: '9876543251', dept: 'BBA', year: '2nd Year', status: 'APPROVED', subBy: coordIds['entrepreneur.coord@club.edu'], createdAt: '2026-08-25 14:30:00' },
    // Entrepreneurship Club - Alumni (Target: 5, 3 Approved, 1 Pending)
    { clubId: clubIds['Entrepreneurship Club'], type: 'ALUMNI', name: 'Deepak Parekh', email: 'deepak.p@alum.edu', phone: '9486676290', gender: 'Male', dob: '1985-06-12', batch: 'BE 2007, MECH', status: 'APPROVED', subBy: coordIds['entrepreneur.coord@club.edu'], createdAt: '2026-09-04 11:00:00' },
    { clubId: clubIds['Entrepreneurship Club'], type: 'ALUMNI', name: 'Sunita Reddy', email: 'sunita.r@alum.edu', phone: '9486676291', gender: 'Female', dob: '1990-11-25', batch: 'B.Tech 2012, IT', status: 'APPROVED', subBy: coordIds['entrepreneur.coord@club.edu'], createdAt: '2026-09-08 15:00:00' },
    { clubId: clubIds['Entrepreneurship Club'], type: 'ALUMNI', name: 'Aditya Birla', email: 'aditya.b@alum.edu', phone: '9486676292', gender: 'Male', dob: '1993-02-18', batch: 'BE 2015, EEE', status: 'PENDING', subBy: coordIds['entrepreneur.coord@club.edu'], createdAt: '2026-09-14 09:30:00' }
  ];

  const memberPassword = await bcrypt.hash('Member@123', 10);

  for (const m of members) {
    // 1. Insert Member Record
    await query(
      `INSERT INTO members (club_id, member_type, name, gender, dob, email, phone, department, year, batch, status, role, submitted_by, admin_remarks, approved_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.clubId,
        m.type || 'STUDENT',
        m.name,
        m.gender || null,
        m.dob || null,
        m.email,
        m.phone,
        m.dept || null,
        m.year || null,
        m.batch || null,
        m.status,
        'MEMBER',
        m.subBy,
        m.remarks || null,
        m.status === 'APPROVED' ? (m.createdAt || '2026-09-01 00:00:00') : null,
        m.createdAt || '2026-09-01 00:00:00'
      ]
    );

    // 2. Create corresponding login account in users table
    const [existingUser] = await query('SELECT id FROM users WHERE email = ?', [m.email.toLowerCase()]);
    if (!existingUser || existingUser.length === 0) {
      await query(
        `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)`,
        [m.name, m.email.toLowerCase(), memberPassword, 'MEMBER', m.clubId]
      );
    }
  }
  console.log('✓ Members seeded with Student/Alumni types, Member roles, and User login accounts (Password: Member@123)');

  // 5. Seed Events with Remarks
  const events = [
    {
      planId: planIds[clubIds['AI Club']],
      clubId: clubIds['AI Club'],
      name: 'Generative AI & Transformer Models Workshop',
      type: 'Hands-on Workshop',
      date: '2026-09-10',
      time: '10:00',
      venue: 'Seminar Hall A',
      alumni: 'John Doe - Senior AI Engineer @ Google',
      desc: 'Hands-on transformer models and API integration session.',
      remarks: 'Conducted successfully with 85 attendees. Certificates issued.',
      status: 'COMPLETED'
    },
    {
      planId: planIds[clubIds['IT Club']],
      clubId: clubIds['IT Club'],
      name: 'Alumni Tech Talk: Scalable Cloud Architecture',
      type: 'Alumni Interaction',
      date: '2026-09-20',
      time: '14:00',
      venue: 'Auditorium 2',
      alumni: 'Sarah Jenkins - Principal Architect @ AWS',
      desc: 'Interactive guidance session on cloud scalability and career pathways.',
      remarks: 'Rescheduled from 15th Sep due to speaker corporate travel conflict.',
      status: 'RESCHEDULED'
    },
    {
      planId: planIds[clubIds['IT Club']],
      clubId: clubIds['IT Club'],
      name: 'Autumn 24-Hour Codefest & Hackathon',
      type: 'Hackathon',
      date: '2026-09-26',
      time: '09:00',
      venue: 'Computing Lab 4',
      alumni: 'Alumni Mentorship Panel',
      desc: 'Annual intra-college hackathon building open-source sustainability apps.',
      remarks: 'Lab booked and student teams registered. Refreshments confirmed.',
      status: 'PLANNED'
    },
    {
      planId: planIds[clubIds['Electronics Club']],
      clubId: clubIds['Electronics Club'],
      name: 'IoT & Edge AI Embedded Bootcamp',
      type: 'Technical Bootcamp',
      date: '2026-09-12',
      time: '09:30',
      venue: 'Main Electronics Lab',
      alumni: 'Rajesh Patil - Embedded Systems Lead @ Intel',
      desc: 'Deep dive into microcontrollers, sensors, and edge AI models.',
      remarks: 'Hardware kits distributed to all participating teams.',
      status: 'COMPLETED'
    },
    {
      planId: planIds[clubIds['Auto Club']],
      clubId: clubIds['Auto Club'],
      name: 'Electric Vehicle Powertrain Masterclass',
      type: 'Industry Workshop',
      date: '2026-09-18',
      time: '11:00',
      venue: 'Automobile Workshop Bay',
      alumni: 'Kiran Verma - EV Design Engineer @ Tesla',
      desc: 'Hands-on breakdown of EV motor inverters and BMS protocols.',
      remarks: 'Safety gear and live battery modules inspected.',
      status: 'PLANNED'
    },
    {
      planId: planIds[clubIds['Entrepreneurship Club']],
      clubId: clubIds['Entrepreneurship Club'],
      name: 'Startup Pitch Fest & Angel Investor Summit',
      type: 'Pitch Competition',
      date: '2026-09-22',
      time: '10:00',
      venue: 'Convention Center Hall 1',
      alumni: 'Deepak Parekh - Founder & CEO @ TechVentures',
      desc: 'Annual student venture pitching session with alumni angel investors and mentors.',
      remarks: 'Shortlisted 12 student startup ideas for live pitch round.',
      status: 'PLANNED'
    }
  ];

  const eventIds = {};
  for (const ev of events) {
    const [eRes] = await query(
      `INSERT INTO events (action_plan_id, club_id, event_name, event_type, event_date, event_time, venue, alumni_details, description, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ev.planId, ev.clubId, ev.name, ev.type, ev.date, ev.time, ev.venue, ev.alumni, ev.desc, ev.remarks, ev.status]
    );
    eventIds[ev.name] = eRes.insertId;
  }
  console.log('✓ Events seeded with remarks');

  // 6. Seed Reschedule History
  const reschedEventId = eventIds['Alumni Tech Talk: Scalable Cloud Architecture'];
  if (reschedEventId) {
    await query(
      `INSERT INTO event_reschedules (event_id, old_date, old_time, new_date, new_time, reason, rescheduled_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reschedEventId,
        '2026-09-15',
        '10:00',
        '2026-09-20',
        '14:00',
        'Guest speaker unavailable due to corporate travel schedule.',
        coordIds['it.coord@club.edu']
      ]
    );
    console.log('✓ Reschedule history seeded for Alumni Tech Talk');
  }

  // 7. Seed Report for Completed Event (Coordinator uploaded report)
  const completedEventId = eventIds['Generative AI & Transformer Models Workshop'];
  if (completedEventId) {
    await query(
      `INSERT INTO reports (event_id, file_name, file_path, file_size, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        completedEventId,
        'AI_Workshop_Summary_Report_Sep2026.pdf',
        'uploads/sample_ai_workshop_report.pdf',
        1024500,
        'Complete attendance list (85 attendees), photos, and speaker evaluation summaries.',
        coordIds['ai.coord@club.edu']
      ]
    );
    console.log('✓ Event report seeded for AI Workshop');
  }

  console.log('========================================================');
  console.log('🎉 Database seeding completed successfully!');
  console.log('Default Accounts:');
  console.log('  Admin:            admin@club.edu / Admin@123');
  console.log('  AI Club Coord:    ai.coord@club.edu / Coord@123');
  console.log('  IT Club Coord:    it.coord@club.edu / Coord@123');
  console.log('  Electronics Coord: electronics.coord@club.edu / Coord@123');
  console.log('  Auto Club Coord:  auto.coord@club.edu / Coord@123');
  console.log('  Entrepreneur Coord: entrepreneur.coord@club.edu / Coord@123');
  console.log('========================================================');
}

if (require.main === module) {
  seedDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed database:', err);
      process.exit(1);
    });
}

module.exports = seedDb;
