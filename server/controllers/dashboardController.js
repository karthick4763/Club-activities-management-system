const { query } = require('../config/db');

async function getAdminDashboard(req, res) {
  try {
    const { month = 'ALL', year = 'ALL', club_id, status, category } = req.query;
    const isWholeYear = month === 'ALL' || !month;
    const isAllYears = year === 'ALL' || !year;
    const selectedMonth = isWholeYear ? 'ALL' : Number(month);
    const selectedYear = isAllYears ? 'ALL' : Number(year);
    const formattedMonth = isWholeYear ? '' : String(selectedMonth).padStart(2, '0');

    // 1. Build dynamic filter conditions for KPIs and stats
    let memberWhere = 'WHERE 1=1';
    const memberParams = [];

    if (club_id && club_id !== 'ALL') {
      memberWhere += ' AND m.club_id = ?';
      memberParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      memberWhere += ' AND c.category = ?';
      memberParams.push(category);
    }
    if (!isAllYears) {
      memberWhere += ` AND (strftime('%Y', m.created_at) = ? OR YEAR(m.created_at) = ?)`;
      memberParams.push(String(selectedYear), selectedYear);
    }
    if (!isWholeYear) {
      memberWhere += ` AND (strftime('%m', m.created_at) = ? OR MONTH(m.created_at) = ?)`;
      memberParams.push(formattedMonth, selectedMonth);
    }

    // Dynamic Filtered Member Counts
    const [filteredMemberCounts] = await query(
      `SELECT 
        COUNT(*) AS total_members,
        COUNT(CASE WHEN m.member_type = 'STUDENT' THEN 1 END) AS student_members,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' THEN 1 END) AS alumni_members,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'APPROVED' THEN 1 END) AS approved_alumni,
        COUNT(CASE WHEN m.status = 'APPROVED' THEN 1 END) AS approved_members,
        COUNT(CASE WHEN m.status = 'PENDING' THEN 1 END) AS pending_approvals,
        COUNT(CASE WHEN m.status = 'REJECTED' THEN 1 END) AS rejected_members
       FROM members m
       JOIN clubs c ON m.club_id = c.id
       ${memberWhere}`,
      memberParams
    );

    // Dynamic Filtered Events Counts
    let eventWhere = 'WHERE 1=1';
    const eventCountParams = [];
    if (club_id && club_id !== 'ALL') {
      eventWhere += ' AND e.club_id = ?';
      eventCountParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      eventWhere += ' AND c.category = ?';
      eventCountParams.push(category);
    }
    if (!isAllYears) {
      eventWhere += ` AND (strftime('%Y', e.event_date) = ? OR YEAR(e.event_date) = ?)`;
      eventCountParams.push(String(selectedYear), selectedYear);
    }
    if (!isWholeYear) {
      eventWhere += ` AND (strftime('%m', e.event_date) = ? OR MONTH(e.event_date) = ?)`;
      eventCountParams.push(formattedMonth, selectedMonth);
    }
    if (status && status !== 'ALL') {
      eventWhere += ` AND UPPER(e.status) = ?`;
      eventCountParams.push(status.toUpperCase());
    }

    const [filteredEventCounts] = await query(
      `SELECT 
        COUNT(*) AS total_events,
        COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) AS completed_events,
        COUNT(CASE WHEN e.status = 'PLANNED' THEN 1 END) AS planned_events,
        COUNT(CASE WHEN e.status = 'RESCHEDULED' THEN 1 END) AS rescheduled_events
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       ${eventWhere}`,
      eventCountParams
    );

    // Target sum for the filtered timeframe & clubs (Alumni Outreach Target)
    let planWhere = 'WHERE 1=1';
    const planCountParams = [];
    if (club_id && club_id !== 'ALL') {
      planWhere += ' AND p.club_id = ?';
      planCountParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      planWhere += ' AND c.category = ?';
      planCountParams.push(category);
    }
    if (!isAllYears) {
      planWhere += ' AND p.year = ?';
      planCountParams.push(selectedYear);
    }
    if (!isWholeYear) {
      planWhere += ' AND p.month = ?';
      planCountParams.push(selectedMonth);
    }

    const [planTargetCounts] = await query(
      `SELECT SUM(p.target_members) AS total_target
       FROM monthly_action_plans p
       JOIN clubs c ON p.club_id = c.id
       ${planWhere}`,
      planCountParams
    );
    const dynamicTarget = Number(planTargetCounts[0]?.total_target) || 0;

    const [clubCount] = await query('SELECT COUNT(*) AS total FROM clubs');
    const [reportCounts] = await query('SELECT COUNT(*) AS total_reports FROM reports');

    // 2. Full list of all clubs (always preserved for filter dropdowns)
    const [clubsList] = await query('SELECT id, club_name, category FROM clubs ORDER BY club_name ASC');

    // Club Performance Summary for Selected Year / Month
    let clubsSql = 'SELECT id, club_name, category FROM clubs WHERE 1=1';
    const clubsParams = [];
    if (club_id && club_id !== 'ALL') {
      clubsSql += ' AND id = ?';
      clubsParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      clubsSql += ' AND category = ?';
      clubsParams.push(category);
    }
    clubsSql += ' ORDER BY club_name ASC';

    const [allClubs] = await query(clubsSql, clubsParams);

    const clubPerformance = await Promise.all(
      allClubs.map(async (c) => {
        // Fetch target: sum for all years / whole year if 'ALL', or for specific year/month
        let planSql = `SELECT SUM(target_members) AS total_target FROM monthly_action_plans WHERE club_id = ?`;
        const planParams = [c.id];
        if (!isAllYears) {
          planSql += ` AND year = ?`;
          planParams.push(selectedYear);
        }
        if (!isWholeYear) {
          planSql += ` AND month = ?`;
          planParams.push(selectedMonth);
        }

        const [plan] = await query(planSql, planParams);
        const target = Number(plan[0]?.total_target) || 0;

        // Fetch approved & pending alumni members for this club (Target is for Alumni)
        let memSql = `
          SELECT 
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS approved_alumni,
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'PENDING' THEN 1 END) AS pending_alumni,
            COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS student_count,
            COUNT(*) AS total_count
          FROM members 
          WHERE club_id = ?
        `;
        const memParams = [c.id];
        if (!isAllYears) {
          memSql += ` AND (strftime('%Y', created_at) = ? OR YEAR(created_at) = ?)`;
          memParams.push(String(selectedYear), selectedYear);
        }
        if (!isWholeYear) {
          memSql += ` AND (strftime('%m', created_at) = ? OR MONTH(created_at) = ?)`;
          memParams.push(formattedMonth, selectedMonth);
        }

        const [memStats] = await query(memSql, memParams);
        const approvedAlumni = memStats[0]?.approved_alumni || 0;
        const pendingAlumni = memStats[0]?.pending_alumni || 0;
        const studentCount = memStats[0]?.student_count || 0;
        const totalCount = memStats[0]?.total_count || 0;
        const progress = target > 0 ? Math.min(100, Math.round((approvedAlumni / target) * 100)) : (approvedAlumni > 0 ? 100 : 0);

        // Fetch events count for this club
        let evSql = `
          SELECT 
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed
          FROM events 
          WHERE club_id = ?
        `;
        const evParams = [c.id];
        if (!isAllYears) {
          evSql += ` AND (strftime('%Y', event_date) = ? OR YEAR(event_date) = ?)`;
          evParams.push(String(selectedYear), selectedYear);
        }
        if (!isWholeYear) {
          evSql += ` AND (strftime('%m', event_date) = ? OR MONTH(event_date) = ?)`;
          evParams.push(formattedMonth, selectedMonth);
        }
        if (status && status !== 'ALL') {
          evSql += ` AND UPPER(status) = ?`;
          evParams.push(status.toUpperCase());
        }

        const [evStats] = await query(evSql, evParams);

        return {
          club_id: c.id,
          club_name: c.club_name,
          category: c.category,
          target_members: target, // Alumni target
          approved_members: approvedAlumni, // Approved alumni (counted for target)
          approved_alumni: approvedAlumni,
          pending_members: pendingAlumni,
          pending_alumni: pendingAlumni,
          student_members: studentCount,
          total_members: totalCount,
          remaining_target: Math.max(0, target - approvedAlumni),
          progress_percent: progress,
          total_events: evStats[0]?.total || 0,
          completed_events: evStats[0]?.completed || 0
        };
      })
    );

    // 3. Multi-filtered Events Query
    let eventSql = `
      SELECT 
        e.*, 
        c.club_name,
        c.category AS club_category,
        r.id AS report_id,
        r.file_name AS report_file_name,
        r.uploaded_at AS report_uploaded_at,
        COUNT(res.id) AS reschedule_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN reports r ON r.event_id = e.id
      LEFT JOIN event_reschedules res ON res.event_id = e.id
      WHERE 1=1
    `;
    const eventParams = [];

    if (club_id && club_id !== 'ALL') {
      eventSql += ` AND e.club_id = ?`;
      eventParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      eventSql += ` AND c.category = ?`;
      eventParams.push(category);
    }
    if (!isAllYears) {
      eventSql += ` AND (strftime('%Y', e.event_date) = ? OR YEAR(e.event_date) = ?)`;
      eventParams.push(String(selectedYear), selectedYear);
    }
    if (!isWholeYear) {
      eventSql += ` AND (strftime('%m', e.event_date) = ? OR MONTH(e.event_date) = ?)`;
      eventParams.push(formattedMonth, selectedMonth);
    }
    if (status && status !== 'ALL') {
      eventSql += ` AND UPPER(e.status) = ?`;
      eventParams.push(status.toUpperCase());
    }
    eventSql += ` GROUP BY e.id ORDER BY e.event_date ASC, e.event_time ASC`;

    const [filteredEvents] = await query(eventSql, eventParams);

    // 4. Pending Member Requests for review
    const [pendingMembers] = await query(
      `SELECT m.*, c.club_name, c.category AS club_category, u.name AS submitted_by_name 
       FROM members m 
       JOIN clubs c ON m.club_id = c.id 
       LEFT JOIN users u ON m.submitted_by = u.id 
       WHERE m.status = 'PENDING' 
       ORDER BY m.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      kpis: {
        total_clubs: clubsList.length,
        total_members: filteredMemberCounts[0]?.total_members || 0,
        student_members: filteredMemberCounts[0]?.student_members || 0,
        alumni_members: filteredMemberCounts[0]?.alumni_members || 0,
        approved_alumni: filteredMemberCounts[0]?.approved_alumni || 0,
        pending_member_approvals: filteredMemberCounts[0]?.pending_approvals || 0,
        approved_members: filteredMemberCounts[0]?.approved_members || 0,
        rejected_members: filteredMemberCounts[0]?.rejected_members || 0,
        target_members: dynamicTarget,
        total_events: filteredEventCounts[0]?.total_events || 0,
        completed_events: filteredEventCounts[0]?.completed_events || 0,
        planned_events: filteredEventCounts[0]?.planned_events || 0,
        rescheduled_events: filteredEventCounts[0]?.rescheduled_events || 0,
        total_reports: reportCounts[0]?.total_reports || 0
      },
      all_clubs: clubsList,
      clubPerformance,
      filteredEvents,
      pendingMembers,
      selectedFilters: {
        month: selectedMonth,
        year: selectedYear,
        isWholeYear,
        isAllYears,
        club_id: club_id || 'ALL',
        category: category || 'ALL',
        status: status || 'ALL'
      }
    });
  } catch (err) {
    console.error('getAdminDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate admin dashboard: ' + err.message });
  }
}

async function getCoordinatorDashboard(req, res) {
  try {
    const clubId = req.user.club_id;
    const { month = 'ALL', year = 'ALL' } = req.query;
    const isWholeYear = month === 'ALL' || !month;
    const isAllYears = year === 'ALL' || !year;
    const selectedMonth = isWholeYear ? 'ALL' : Number(month);
    const selectedYear = isAllYears ? 'ALL' : Number(year);
    const formattedMonth = isWholeYear ? '' : String(selectedMonth).padStart(2, '0');

    if (!clubId) {
      return res.status(400).json({ success: false, message: 'Coordinator is not assigned to any club container.' });
    }

    // 1. Club Details
    const [clubData] = await query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!clubData || clubData.length === 0) {
      return res.status(404).json({ success: false, message: 'Club container not found.' });
    }

    // 2. Club Member KPIs (Overall all-time totals)
    const [memberStats] = await query(
      `SELECT 
        COUNT(*) AS total_club_members,
        COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS student_members,
        COUNT(CASE WHEN member_type = 'ALUMNI' THEN 1 END) AS alumni_members,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS total_approved_alumni,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) AS total_approved,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS total_pending,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS total_rejected
       FROM members WHERE club_id = ?`,
      [clubId]
    );

    // 3. Action Plan Target (Alumni Target): sum for year if 'ALL' or specific month
    let planSql = `SELECT SUM(target_members) AS total_target FROM monthly_action_plans WHERE club_id = ?`;
    const planParams = [clubId];
    if (!isAllYears) {
      planSql += ` AND year = ?`;
      planParams.push(selectedYear);
    }
    if (!isWholeYear) {
      planSql += ` AND month = ?`;
      planParams.push(selectedMonth);
    }
    const [monthlyPlan] = await query(planSql, planParams);
    const targetMembers = Number(monthlyPlan[0]?.total_target) || 0;

    // Filtered member statistics for the selected period
    let memSql = `
      SELECT 
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS period_approved_alumni,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'PENDING' THEN 1 END) AS period_pending_alumni,
        COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS period_students,
        COUNT(CASE WHEN member_type = 'ALUMNI' THEN 1 END) AS period_alumni,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) AS period_approved,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS period_pending,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS period_rejected,
        COUNT(*) AS period_total
      FROM members 
      WHERE club_id = ?
    `;
    const memParams = [clubId];

    if (!isAllYears) {
      memSql += ` AND (strftime('%Y', created_at) = ? OR YEAR(created_at) = ?)`;
      memParams.push(String(selectedYear), selectedYear);
    }

    if (!isWholeYear) {
      memSql += ` AND (strftime('%m', created_at) = ? OR MONTH(created_at) = ?)`;
      memParams.push(formattedMonth, selectedMonth);
    }

    const [monthMemberStats] = await query(memSql, memParams);
    const periodApprovedAlumni = monthMemberStats[0]?.period_approved_alumni || 0;
    const periodPendingAlumni = monthMemberStats[0]?.period_pending_alumni || 0;
    const remainingTarget = Math.max(0, targetMembers - periodApprovedAlumni);
    const progressPercent = targetMembers > 0 
      ? Math.min(100, Math.round((periodApprovedAlumni / targetMembers) * 100)) 
      : (periodApprovedAlumni > 0 ? 100 : 0);

    // 4. Events for selected period
    let evSql = `
      SELECT 
        e.*, 
        r.id AS report_id, 
        r.file_name AS report_file_name,
        r.uploaded_at AS report_uploaded_at,
        COUNT(res.id) AS reschedule_count
      FROM events e
      LEFT JOIN reports r ON r.event_id = e.id
      LEFT JOIN event_reschedules res ON res.event_id = e.id
      WHERE e.club_id = ?
    `;
    const evParams = [clubId];

    if (!isAllYears) {
      evSql += ` AND (strftime('%Y', e.event_date) = ? OR YEAR(e.event_date) = ?)`;
      evParams.push(String(selectedYear), selectedYear);
    }

    if (!isWholeYear) {
      evSql += ` AND (strftime('%m', e.event_date) = ? OR MONTH(e.event_date) = ?)`;
      evParams.push(formattedMonth, selectedMonth);
    }

    evSql += ` GROUP BY e.id ORDER BY e.event_date ASC, e.event_time ASC`;

    const [events] = await query(evSql, evParams);

    return res.status(200).json({
      success: true,
      club: clubData[0],
      month: selectedMonth,
      year: selectedYear,
      isWholeYear,
      isAllYears,
      kpis: {
        total_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.total_club_members || 0)
          : (monthMemberStats[0]?.period_total || 0),
        student_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.student_members || 0)
          : (monthMemberStats[0]?.period_students || 0),
        alumni_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.alumni_members || 0)
          : (monthMemberStats[0]?.period_alumni || 0),
        approved_alumni: periodApprovedAlumni,
        approved_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.total_approved || 0)
          : (monthMemberStats[0]?.period_approved || 0),
        pending_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.total_pending || 0)
          : (monthMemberStats[0]?.period_pending || 0),
        rejected_members: (isWholeYear && isAllYears)
          ? (memberStats[0]?.total_rejected || 0)
          : (monthMemberStats[0]?.period_rejected || 0),
        all_time_total_members: memberStats[0]?.total_club_members || 0,
        all_time_student_members: memberStats[0]?.student_members || 0,
        target_members: targetMembers, // Alumni Target
        monthly_approved: periodApprovedAlumni, // Approved Alumni in period
        monthly_pending: periodPendingAlumni,
        remaining_target: remainingTarget,
        progress_percent: progressPercent,
        total_events: events.length,
        completed_events: events.filter(e => e.status === 'COMPLETED').length,
        rescheduled_events: events.filter(e => e.status === 'RESCHEDULED').length
      },
      events
    });
  } catch (err) {
    console.error('getCoordinatorDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate coordinator dashboard: ' + err.message });
  }
}

module.exports = {
  getAdminDashboard,
  getCoordinatorDashboard
};
