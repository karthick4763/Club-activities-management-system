const { query } = require('../config/db');

async function getActionPlans(req, res) {
  try {
    const { club_id, month, year } = req.query;

    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      targetClubId = req.user.club_id;
    }

    let sql = `
      SELECT 
        p.id,
        p.club_id,
        c.club_name,
        p.month,
        p.year,
        p.target_members,
        p.created_at,
        p.updated_at
      FROM monthly_action_plans p
      JOIN clubs c ON p.club_id = c.id
      WHERE 1=1
    `;

    const params = [];
    if (targetClubId && targetClubId !== 'ALL') {
      sql += ` AND p.club_id = ?`;
      params.push(Number(targetClubId));
    }
    if (month && month !== 'ALL') {
      sql += ` AND p.month = ?`;
      params.push(Number(month));
    }
    if (year && year !== 'ALL') {
      sql += ` AND p.year = ?`;
      params.push(Number(year));
    }

    sql += ` ORDER BY p.year DESC, p.month DESC`;

    const [plans] = await query(sql, params);

    // Enrich each plan with dynamic target progress and associated events
    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        // Fetch events under this plan
        const [events] = await query(
          `SELECT e.*, r.id AS report_id, r.file_name AS report_file_name, r.uploaded_at AS report_uploaded_at
           FROM events e
           LEFT JOIN reports r ON r.event_id = e.id
           WHERE e.action_plan_id = ?
           ORDER BY e.event_date ASC, e.event_time ASC`,
          [plan.id]
        );

        // Fetch members added for this club in this month & year
        // NOTE: As per requirements, target strictly measures Alumni member additions
        const formattedMonth = String(plan.month).padStart(2, '0');
        const [memberStats] = await query(
          `SELECT 
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'APPROVED' THEN 1 END) AS approved_alumni_count,
            COUNT(CASE WHEN member_type = 'ALUMNI' AND status = 'PENDING' THEN 1 END) AS pending_alumni_count,
            COUNT(CASE WHEN member_type = 'STUDENT' THEN 1 END) AS student_count,
            COUNT(*) AS total_added
           FROM members 
           WHERE club_id = ? 
             AND (strftime('%Y', created_at) = ? OR YEAR(created_at) = ?)
             AND (strftime('%m', created_at) = ? OR MONTH(created_at) = ?)`,
          [plan.club_id, String(plan.year), Number(plan.year), formattedMonth, Number(plan.month)]
        );

        const approvedAlumni = memberStats[0]?.approved_alumni_count || 0;
        const pendingAlumni = memberStats[0]?.pending_alumni_count || 0;
        const studentCount = memberStats[0]?.student_count || 0;
        const target = plan.target_members || 0;
        const remaining = Math.max(0, target - approvedAlumni);
        const progress = target > 0 ? Math.min(100, Math.round((approvedAlumni / target) * 100)) : (approvedAlumni > 0 ? 100 : 0);

        return {
          ...plan,
          approved_members: approvedAlumni, // Target progress based on approved alumni
          approved_alumni: approvedAlumni,
          pending_members: pendingAlumni,
          pending_alumni: pendingAlumni,
          student_members: studentCount,
          total_members: memberStats[0]?.total_added || 0,
          remaining_target: remaining,
          progress_percent: progress,
          events_count: events.length,
          events
        };
      })
    );

    return res.status(200).json({ success: true, count: enrichedPlans.length, plans: enrichedPlans });
  } catch (err) {
    console.error('getActionPlans error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch action plans.' });
  }
}

async function upsertActionPlan(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    let { club_id, month, year, target_members } = req.body;

    if (req.user.role === 'COORDINATOR') {
      club_id = req.user.club_id;
    }

    if (!club_id || !month || !year) {
      return res.status(400).json({ success: false, message: 'Club ID, month, and year are required.' });
    }

    month = Number(month);
    year = Number(year);
    target_members = Number(target_members) || 0;

    // Check if an action plan already exists for this club & month/year
    const [existing] = await query(
      `SELECT id FROM monthly_action_plans WHERE club_id = ? AND month = ? AND year = ?`,
      [club_id, month, year]
    );

    let planId;
    if (existing && existing.length > 0) {
      planId = existing[0].id;
      await query(
        `UPDATE monthly_action_plans 
         SET target_members = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [target_members, planId]
      );
    } else {
      const [result] = await query(
        `INSERT INTO monthly_action_plans (club_id, month, year, target_members) 
         VALUES (?, ?, ?, ?)`,
        [club_id, month, year, target_members]
      );
      planId = result.insertId;
    }

    return res.status(200).json({
      success: true,
      message: 'Monthly action plan saved successfully.',
      planId,
      club_id,
      month,
      year,
      target_members
    });
  } catch (err) {
    console.error('upsertActionPlan error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save action plan.' });
  }
}

module.exports = {
  getActionPlans,
  upsertActionPlan
};
