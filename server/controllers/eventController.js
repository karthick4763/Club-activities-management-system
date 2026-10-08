const { query } = require('../config/db');

async function getEvents(req, res) {
  try {
    const { club_id, status, month, year, action_plan_id } = req.query;

    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      targetClubId = req.user.club_id;
    }

    let sql = `
      SELECT 
        e.*,
        c.club_name,
        c.category AS club_category,
        p.month AS plan_month,
        p.year AS plan_year,
        r.id AS report_id,
        r.file_name AS report_file_name,
        r.file_path AS report_file_path,
        r.uploaded_at AS report_uploaded_at,
        COUNT(res.id) AS reschedule_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      JOIN monthly_action_plans p ON e.action_plan_id = p.id
      LEFT JOIN reports r ON r.event_id = e.id
      LEFT JOIN event_reschedules res ON res.event_id = e.id
      WHERE 1=1
    `;

    const params = [];

    if (targetClubId && targetClubId !== 'ALL') {
      sql += ` AND e.club_id = ?`;
      params.push(Number(targetClubId));
    }

    if (action_plan_id && action_plan_id !== 'ALL') {
      sql += ` AND e.action_plan_id = ?`;
      params.push(Number(action_plan_id));
    }

    if (status && status !== 'ALL') {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    if (year && year !== 'ALL') {
      sql += ` AND (strftime('%Y', e.event_date) = ? OR YEAR(e.event_date) = ?)`;
      params.push(String(year), Number(year));
    }

    if (month && month !== 'ALL') {
      const formattedMonth = String(month).padStart(2, '0');
      sql += ` AND (strftime('%m', e.event_date) = ? OR MONTH(e.event_date) = ?)`;
      params.push(formattedMonth, Number(month));
    }

    sql += ` GROUP BY e.id ORDER BY e.event_date ASC, e.event_time ASC`;

    const [events] = await query(sql, params);
    return res.status(200).json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('getEvents error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
}

async function createEvent(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const {
      action_plan_id,
      club_id,
      event_name,
      event_type,
      event_date,
      event_time,
      venue,
      alumni_details,
      description,
      remarks,
      status
    } = req.body;

    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR') {
      targetClubId = req.user.club_id;
    }

    if (!event_name || !event_type || !event_date || !event_time || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Event Name, Event Type, Date, Time, and Venue are required.'
      });
    }

    // Validate action plan existence if provided
    let targetPlanId = action_plan_id;
    if (targetPlanId) {
      const [existingPlan] = await query('SELECT id FROM monthly_action_plans WHERE id = ?', [targetPlanId]);
      if (!existingPlan || existingPlan.length === 0) {
        return res.status(400).json({ success: false, message: 'Specified action_plan_id does not exist.' });
      }
    } else {
      const dateObj = new Date(event_date);
      const eventMonth = dateObj.getMonth() + 1;
      const eventYear = dateObj.getFullYear();

      const [existingPlan] = await query(
        `SELECT id FROM monthly_action_plans WHERE club_id = ? AND month = ? AND year = ?`,
        [targetClubId, eventMonth, eventYear]
      );

      if (existingPlan && existingPlan.length > 0) {
        targetPlanId = existingPlan[0].id;
      } else {
        const [newPlan] = await query(
          `INSERT INTO monthly_action_plans (club_id, month, year, target_members) VALUES (?, ?, ?, 0)`,
          [targetClubId, eventMonth, eventYear]
        );
        targetPlanId = newPlan.insertId;
      }
    }

    const ALLOWED_STATUSES = ['PLANNED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'];
    const finalStatus = status ? status.toUpperCase() : 'PLANNED';
    if (!ALLOWED_STATUSES.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const [result] = await query(
      `INSERT INTO events 
       (action_plan_id, club_id, event_name, event_type, event_date, event_time, venue, alumni_details, description, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetPlanId,
        targetClubId,
        event_name.trim(),
        event_type.trim(),
        event_date,
        event_time.trim(),
        venue.trim(),
        alumni_details ? alumni_details.trim() : null,
        description ? description.trim() : null,
        remarks ? remarks.trim() : null,
        finalStatus
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Event scheduled successfully.',
      eventId: result.insertId
    });
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
}

async function updateEvent(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const eventId = req.params.id;
    const {
      event_name,
      event_type,
      event_date,
      event_time,
      venue,
      alumni_details,
      description,
      remarks,
      status
    } = req.body;

    const [events] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (req.user.role === 'COORDINATOR' && Number(event.club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only update events in your club.' });
    }

    await query(
      `UPDATE events 
       SET event_name = ?, event_type = ?, event_date = ?, event_time = ?, venue = ?, alumni_details = ?, description = ?, remarks = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        event_name || event.event_name,
        event_type || event.event_type,
        event_date || event.event_date,
        event_time || event.event_time,
        venue || event.venue,
        alumni_details !== undefined ? alumni_details : event.alumni_details,
        description !== undefined ? description : event.description,
        remarks !== undefined ? remarks : event.remarks,
        status || event.status,
        eventId
      ]
    );

    return res.status(200).json({ success: true, message: 'Event updated successfully.' });
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
}

async function toggleEventStatus(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const eventId = req.params.id;
    const { status, remarks } = req.body;

    const [events] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (req.user.role === 'COORDINATOR' && Number(event.club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only modify your club events.' });
    }

    const newStatus = status || (event.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED');
    const newRemarks = remarks !== undefined ? remarks : event.remarks;

    await query(
      `UPDATE events SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, newRemarks, eventId]
    );

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    console.error('toggleEventStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update event status.' });
  }
}

async function rescheduleEvent(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const eventId = req.params.id;
    const { new_date, new_time, reason } = req.body;

    if (!new_date || !new_time || !reason) {
      return res.status(400).json({
        success: false,
        message: 'New Date, New Time, and Reschedule Reason are required.'
      });
    }

    const [events] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (req.user.role === 'COORDINATOR' && Number(event.club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot reschedule other club events.' });
    }

    // 1. Record in event_reschedules history table
    await query(
      `INSERT INTO event_reschedules (event_id, old_date, old_time, new_date, new_time, reason, rescheduled_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        event.event_date,
        event.event_time,
        new_date,
        new_time,
        reason.trim(),
        req.user.id
      ]
    );

    // 2. Update event with new date/time, remarks, and mark status as RESCHEDULED
    const updatedRemarks = `Rescheduled to ${new_date}: ${reason.trim()}`;
    await query(
      `UPDATE events 
       SET event_date = ?, event_time = ?, status = 'RESCHEDULED', remarks = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [new_date, new_time, updatedRemarks, eventId]
    );

    return res.status(200).json({
      success: true,
      message: `Event "${event.event_name}" rescheduled to ${new_date} at ${new_time}. History recorded.`
    });
  } catch (err) {
    console.error('rescheduleEvent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reschedule event.' });
  }
}

async function getRescheduleHistory(req, res) {
  try {
    const eventId = req.params.id;

    const [events] = await query('SELECT id, club_id FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      if (Number(events[0].club_id) !== Number(req.user.club_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access to this event history is restricted.' });
      }
    }

    const [history] = await query(
      `SELECT r.*, u.name AS rescheduled_by_name 
       FROM event_reschedules r
       JOIN users u ON r.rescheduled_by = u.id
       WHERE r.event_id = ?
       ORDER BY r.created_at DESC`,
      [eventId]
    );

    return res.status(200).json({ success: true, count: history.length, history });
  } catch (err) {
    console.error('getRescheduleHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reschedule history.' });
  }
}

async function deleteEvent(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const eventId = req.params.id;
    const [events] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (req.user.role === 'COORDINATOR' && Number(events[0].club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete events in your club.' });
    }

    await query('DELETE FROM events WHERE id = ?', [eventId]);
    return res.status(200).json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
}

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  toggleEventStatus,
  rescheduleEvent,
  getRescheduleHistory,
  deleteEvent
};
