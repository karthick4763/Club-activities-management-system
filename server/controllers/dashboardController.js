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
      memberWhere += ` AND YEAR(m.created_at) = ?`;
      memberParams.push(Number(selectedYear));
    }
    if (!isWholeYear) {
      memberWhere += ` AND MONTH(m.created_at) = ?`;
      memberParams.push(Number(selectedMonth));
    }

    // Dynamic Filtered Member Counts
    const [filteredMemberCounts] = await query(
      `SELECT 
        COUNT(*) AS total_members,
        COUNT(CASE WHEN m.member_type = 'STUDENT' THEN 1 END) AS student_members,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' THEN 1 END) AS alumni_members,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'APPROVED' THEN 1 END) AS approved_alumni,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'APPROVED' AND m.is_existing = 1 THEN 1 END) AS portal_existing_alumni,
        COUNT(CASE WHEN m.member_type = 'ALUMNI' AND m.status = 'APPROVED' AND (m.is_existing = 0 OR m.is_existing IS NULL) THEN 1 END) AS portal_new_alumni,
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
      eventWhere += ` AND YEAR(e.event_date) = ?`;
      eventCountParams.push(Number(selectedYear));
    }
    if (!isWholeYear) {
      eventWhere += ` AND MONTH(e.event_date) = ?`;
      eventCountParams.push(Number(selectedMonth));
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
      `SELECT 
        SUM(p.target_members) AS total_target,
        SUM(p.target_events) AS total_events_target
       FROM monthly_action_plans p
       JOIN clubs c ON p.club_id = c.id
       ${planWhere}`,
      planCountParams
    );
    const dynamicTarget = Number(planTargetCounts[0]?.total_target) || 0;
    const dynamicEventsTarget = Number(planTargetCounts[0]?.total_events_target) || 0;

    // Baseline counts for filtered clubs
    let baselineWhere = 'WHERE 1=1';
    const baselineParams = [];
    if (club_id && club_id !== 'ALL') {
      baselineWhere += ' AND id = ?';
      baselineParams.push(Number(club_id));
    }
    if (category && category !== 'ALL') {
      baselineWhere += ' AND category = ?';
      baselineParams.push(category);
    }
    const [baselineStats] = await query(
      `SELECT 
        SUM(existing_alumni_count) AS total_existing_alumni, 
        SUM(existing_events_completed_count) AS total_existing_events 
       FROM clubs ${baselineWhere}`,
      baselineParams
    );
    const existingAlumniTotal = Number(baselineStats[0]?.total_existing_alumni) || 0;
    const existingEventsTotal = Number(baselineStats[0]?.total_existing_events) || 0;

    const [clubCount] = await query('SELECT COUNT(*) AS total FROM clubs');
    const [reportCounts] = await query('SELECT COUNT(*) AS total_reports FROM reports');

    // 2. Full list of all clubs (always preserved for filter dropdowns)
    const [clubsList] = await query('SELECT id, club_name, category, existing_alumni_count, existing_events_completed_count FROM clubs ORDER BY club_name ASC');

    // Club Performance Summary for Selected Year / Month
    let clubsSql = 'SELECT id, club_name, category, existing_alumni_count, existing_events_completed_count FROM clubs WHERE 1=1';
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
        let planSql = `SELECT SUM(target_members) AS total_target, SUM(target_events) AS total_events_target FROM monthly_action_plans WHERE club_id = ?`;
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
        const targetEv = Number(plan[0]?.total_events_target) || 0;

        // Fetch approved & pending alumni members for this club (Target is for Alumni)
        let memSql = `
          SELECT 
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS approved_alumni,
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND is_existing = 1 THEN 1 END) AS portal_existing_alumni,
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND (is_existing = 0 OR is_existing IS NULL) THEN 1 END) AS portal_new_alumni,
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'PENDING' THEN 1 END) AS pending_alumni,
            COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS student_count,
            COUNT(*) AS total_count
          FROM members 
          WHERE club_id = ?
        `;
        const memParams = [c.id];
        if (!isAllYears) {
          memSql += ` AND YEAR(created_at) = ?`;
          memParams.push(Number(selectedYear));
        }
        if (!isWholeYear) {
          memSql += ` AND MONTH(created_at) = ?`;
          memParams.push(Number(selectedMonth));
        }

        const [memStats] = await query(memSql, memParams);
        const portalApprovedAlumni = memStats[0]?.approved_alumni || 0;
        const portalExistingAlumni = memStats[0]?.portal_existing_alumni || 0;
        const portalNewAlumni = memStats[0]?.portal_new_alumni || 0;
        const pendingAlumni = memStats[0]?.pending_alumni || 0;
        const studentCount = memStats[0]?.student_count || 0;
        const baselineAlumni = Number(c.existing_alumni_count) || 0;
        const existingAlumni = baselineAlumni + portalExistingAlumni;
        const actualAlumni = existingAlumni + portalNewAlumni;

        const progress = target > 0 ? Math.min(100, Math.round((portalNewAlumni / target) * 100)) : (portalNewAlumni > 0 ? 100 : 0);

        // Fetch events count for this club
        let evSql = `
          SELECT 
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
            COUNT(CASE WHEN status = 'PLANNED' THEN 1 END) AS planned,
            COUNT(CASE WHEN status = 'RESCHEDULED' THEN 1 END) AS rescheduled
          FROM events 
          WHERE club_id = ?
        `;
        const evParams = [c.id];
        if (!isAllYears) {
          evSql += ` AND YEAR(event_date) = ?`;
          evParams.push(Number(selectedYear));
        }
        if (!isWholeYear) {
          evSql += ` AND MONTH(event_date) = ?`;
          evParams.push(Number(selectedMonth));
        }
        if (status && status !== 'ALL') {
          evSql += ` AND UPPER(status) = ?`;
          evParams.push(status.toUpperCase());
        }

        const [evStats] = await query(evSql, evParams);
        const existingEvents = Number(c.existing_events_completed_count) || 0;
        const portalCompletedEvents = evStats[0]?.completed || 0;
        const actualCompletedEvents = existingEvents + portalCompletedEvents;
        const targetEvents = targetEv > 0 ? targetEv : (evStats[0]?.total || 0);

        return {
          club_id: c.id,
          club_name: c.club_name,
          category: c.category,
          existing_alumni_count: existingAlumni,
          portal_approved_alumni: portalApprovedAlumni,
          actual_alumni: actualAlumni,
          target_members: target, // Alumni target
          approved_members: actualAlumni,
          approved_alumni: actualAlumni,
          pending_members: pendingAlumni,
          pending_alumni: pendingAlumni,
          student_members: studentCount,
          total_members: studentCount + actualAlumni,
          remaining_target: Math.max(0, target - portalApprovedAlumni),
          progress_percent: progress,
          existing_events_completed_count: existingEvents,
          portal_completed_events: portalCompletedEvents,
          actual_completed_events: actualCompletedEvents,
          completed_events: actualCompletedEvents,
          target_events: targetEvents,
          total_events: evStats[0]?.total || 0,
          planned_events: evStats[0]?.planned || 0,
          rescheduled_events: evStats[0]?.rescheduled || 0
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
        COALESCE(res.reschedule_count, 0) AS reschedule_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN reports r ON r.event_id = e.id
      LEFT JOIN (SELECT event_id, COUNT(*) AS reschedule_count FROM event_reschedules GROUP BY event_id) res ON res.event_id = e.id
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
      eventSql += ` AND YEAR(e.event_date) = ?`;
      eventParams.push(Number(selectedYear));
    }
    if (!isWholeYear) {
      eventSql += ` AND MONTH(e.event_date) = ?`;
      eventParams.push(Number(selectedMonth));
    }
    if (status && status !== 'ALL') {
      eventSql += ` AND UPPER(e.status) = ?`;
      eventParams.push(status.toUpperCase());
    }
    eventSql += ` ORDER BY e.event_date ASC, e.event_time ASC`;

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

    const adminPortalExistingAlumni = Number(filteredMemberCounts[0]?.portal_existing_alumni) || 0;
    const adminPortalNewAlumni = Number(filteredMemberCounts[0]?.portal_new_alumni) || 0;
    const adminTotalExistingAlumni = existingAlumniTotal + adminPortalExistingAlumni;
    const adminActualAlumni = adminTotalExistingAlumni + adminPortalNewAlumni;

    return res.status(200).json({
      success: true,
      kpis: {
        total_clubs: clubsList.length,
        total_members: (filteredMemberCounts[0]?.student_members || 0) + adminActualAlumni,
        student_members: filteredMemberCounts[0]?.student_members || 0,
        existing_alumni: adminTotalExistingAlumni,
        portal_existing_alumni: adminPortalExistingAlumni,
        portal_new_alumni: adminPortalNewAlumni,
        portal_approved_alumni: adminPortalNewAlumni,
        monthly_approved: adminPortalNewAlumni,
        actual_alumni: adminActualAlumni,
        alumni_members: adminActualAlumni,
        approved_alumni: adminActualAlumni,
        pending_member_approvals: filteredMemberCounts[0]?.pending_approvals || 0,
        pending_alumni: filteredMemberCounts[0]?.pending_approvals || 0,
        approved_members: (filteredMemberCounts[0]?.student_members || 0) + adminActualAlumni,
        rejected_members: filteredMemberCounts[0]?.rejected_members || 0,
        target_members: dynamicTarget,
        existing_events_completed: existingEventsTotal,
        portal_completed_events: filteredEventCounts[0]?.completed_events || 0,
        actual_completed_events: existingEventsTotal + (filteredEventCounts[0]?.completed_events || 0),
        completed_events: existingEventsTotal + (filteredEventCounts[0]?.completed_events || 0),
        target_events: dynamicEventsTarget > 0 ? dynamicEventsTarget : (filteredEventCounts[0]?.total_events || 0),
        total_events: filteredEventCounts[0]?.total_events || 0,
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

    // 1. Club Details (including baseline counts)
    const [clubData] = await query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!clubData || clubData.length === 0) {
      return res.status(404).json({ success: false, message: 'Club container not found.' });
    }
    const currentClub = clubData[0];
    const existingAlumni = Number(currentClub.existing_alumni_count) || 0;
    const existingEventsCompleted = Number(currentClub.existing_events_completed_count) || 0;

    // 2. Club Member KPIs (Overall all-time totals from portal)
    const [memberStats] = await query(
      `SELECT 
        COUNT(*) AS total_club_members,
        COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS student_members,
        COUNT(CASE WHEN member_type = 'ALUMNI' THEN 1 END) AS alumni_members,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS total_approved_alumni,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND is_existing = 1 THEN 1 END) AS total_existing_alumni,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND (is_existing = 0 OR is_existing IS NULL) THEN 1 END) AS total_new_alumni,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) AS total_approved,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS total_pending,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS total_rejected
       FROM members WHERE club_id = ?`,
      [clubId]
    );

    // 3. Action Plan Target (Alumni Target & Event Target)
    let planSql = `SELECT SUM(target_members) AS total_target, SUM(target_events) AS total_events_target FROM monthly_action_plans WHERE club_id = ?`;
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
    const targetEventsGoal = Number(monthlyPlan[0]?.total_events_target) || 0;

    // Filtered member statistics for the selected period
    let memSql = `
      SELECT 
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS period_approved_alumni,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND is_existing = 1 THEN 1 END) AS period_existing_alumni,
        COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' AND (is_existing = 0 OR is_existing IS NULL) THEN 1 END) AS period_new_alumni,
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
      memSql += ` AND YEAR(created_at) = ?`;
      memParams.push(Number(selectedYear));
    }

    if (!isWholeYear) {
      memSql += ` AND MONTH(created_at) = ?`;
      memParams.push(Number(selectedMonth));
    }

    const [monthMemberStats] = await query(memSql, memParams);
    const periodApprovedAlumni = monthMemberStats[0]?.period_approved_alumni || 0;
    const periodPendingAlumni = monthMemberStats[0]?.period_pending_alumni || 0;
    const allTimeApprovedAlumni = memberStats[0]?.total_approved_alumni || 0;
    const allTimePendingAlumni = memberStats[0]?.total_pending || 0;
    const allTimeStudents = memberStats[0]?.student_members || 0;
    const periodStudents = monthMemberStats[0]?.period_students || 0;

    const portalApprovedAlumni = (isWholeYear && isAllYears) ? allTimeApprovedAlumni : periodApprovedAlumni;
    const portalExistingAlumni = (isWholeYear && isAllYears)
      ? (Number(memberStats[0]?.total_existing_alumni) || 0)
      : (Number(monthMemberStats[0]?.period_existing_alumni) || 0);
    const portalNewAlumni = (isWholeYear && isAllYears)
      ? (Number(memberStats[0]?.total_new_alumni) || 0)
      : (Number(monthMemberStats[0]?.period_new_alumni) || 0);

    const pendingAlumni = (isWholeYear && isAllYears) ? allTimePendingAlumni : periodPendingAlumni;
    const currentStudents = (isWholeYear && isAllYears) ? allTimeStudents : periodStudents;

    // Actual Alumni combines baseline historical count with portal added old members + new members
    const totalExistingAlumni = existingAlumni + portalExistingAlumni;
    const actualAlumni = totalExistingAlumni + portalNewAlumni;
    const totalMembers = currentStudents + actualAlumni;

    const remainingTarget = Math.max(0, targetMembers - portalNewAlumni);
    const progressPercent = targetMembers > 0 
      ? Math.min(100, Math.round((portalNewAlumni / targetMembers) * 100)) 
      : (portalNewAlumni > 0 ? 100 : 0);

    // 4. Events for selected period
    let evSql = `
      SELECT 
        e.*, 
        r.id AS report_id, 
        r.file_name AS report_file_name, 
        r.uploaded_at AS report_uploaded_at,
        COALESCE(res.reschedule_count, 0) AS reschedule_count
      FROM events e
      LEFT JOIN reports r ON r.event_id = e.id
      LEFT JOIN (SELECT event_id, COUNT(*) AS reschedule_count FROM event_reschedules GROUP BY event_id) res ON res.event_id = e.id
      WHERE e.club_id = ?
    `;
    const evParams = [clubId];

    if (!isAllYears) {
      evSql += ` AND YEAR(e.event_date) = ?`;
      evParams.push(Number(selectedYear));
    }

    if (!isWholeYear) {
      evSql += ` AND MONTH(e.event_date) = ?`;
      evParams.push(Number(selectedMonth));
    }

    evSql += ` ORDER BY e.event_date ASC, e.event_time ASC`;

    const [events] = await query(evSql, evParams);

    const portalCompletedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const actualCompletedEvents = existingEventsCompleted + portalCompletedEvents;
    const plannedEvents = events.filter(e => e.status === 'PLANNED').length;
    const rescheduledEvents = events.filter(e => e.status === 'RESCHEDULED').length;
    const targetEvents = targetEventsGoal > 0 ? targetEventsGoal : events.length;

    return res.status(200).json({
      success: true,
      club: currentClub,
      month: selectedMonth,
      year: selectedYear,
      isWholeYear,
      isAllYears,
      kpis: {
        total_members: totalMembers,
        student_members: currentStudents,
        existing_alumni: totalExistingAlumni,
        portal_existing_alumni: portalExistingAlumni,
        portal_new_alumni: portalNewAlumni,
        portal_approved_alumni: portalNewAlumni,
        monthly_approved: portalNewAlumni,
        actual_alumni: actualAlumni,
        alumni_members: actualAlumni,
        approved_alumni: actualAlumni,
        pending_members: pendingAlumni,
        pending_alumni: pendingAlumni,
        monthly_pending: pendingAlumni,
        approved_members: totalMembers,
        rejected_members: (isWholeYear && isAllYears) ? (memberStats[0]?.total_rejected || 0) : (monthMemberStats[0]?.period_rejected || 0),
        all_time_total_members: allTimeStudents + totalExistingAlumni + (Number(memberStats[0]?.total_new_alumni) || 0),
        all_time_student_members: allTimeStudents,
        target_members: targetMembers,
        remaining_target: remainingTarget,
        progress_percent: progressPercent,
        existing_events_completed: existingEventsCompleted,
        portal_completed_events: portalCompletedEvents,
        actual_completed_events: actualCompletedEvents,
        completed_events: actualCompletedEvents,
        target_events: targetEvents,
        total_events: events.length,
        planned_events: plannedEvents,
        rescheduled_events: rescheduledEvents
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
