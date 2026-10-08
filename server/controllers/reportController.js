const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');

async function uploadReport(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const eventId = req.params.eventId;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a PDF, DOCX, or image.' });
    }

    const [events] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!events || events.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (req.user.role === 'COORDINATOR' && Number(event.club_id) !== Number(req.user.club_id)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ success: false, message: 'Forbidden. You can only upload reports for your club events.' });
    }

    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    // Check if report already exists for this event
    const [existingReport] = await query('SELECT * FROM reports WHERE event_id = ?', [eventId]);

    let reportId;
    if (existingReport && existingReport.length > 0) {
      reportId = existingReport[0].id;
      const oldFullPath = path.join(__dirname, '..', existingReport[0].file_path);
      if (fs.existsSync(oldFullPath)) {
        try { fs.unlinkSync(oldFullPath); } catch (e) {}
      }

      await query(
        `UPDATE reports 
         SET file_name = ?, file_path = ?, file_size = ?, description = ?, uploaded_by = ?, uploaded_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.file.originalname, relativePath, req.file.size, description || '', req.user.id, reportId]
      );
    } else {
      const [result] = await query(
        `INSERT INTO reports (event_id, file_name, file_path, file_size, description, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, req.file.originalname, relativePath, req.file.size, description || '', req.user.id]
      );
      reportId = result.insertId;
    }

    // Auto-update event status to COMPLETED
    await query(`UPDATE events SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [eventId]);

    return res.status(200).json({
      success: true,
      message: 'Event report uploaded successfully. Status updated to COMPLETED.',
      reportId,
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error('uploadReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload event report.' });
  }
}

async function getReportByEvent(req, res) {
  try {
    const eventId = req.params.eventId;
    const [reports] = await query(
      `SELECT r.*, u.name AS uploaded_by_name, e.event_name, c.id AS club_id, c.club_name 
       FROM reports r
       JOIN events e ON r.event_id = e.id
       JOIN clubs c ON e.club_id = c.id
       JOIN users u ON r.uploaded_by = u.id
       WHERE r.event_id = ?`,
      [eventId]
    );

    if (!reports || reports.length === 0) {
      return res.status(404).json({ success: false, message: 'No report uploaded for this event yet.' });
    }

    // IDOR protection: Coordinators and members can only view reports for their club
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      if (Number(reports[0].club_id) !== Number(req.user.club_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access to this report is restricted.' });
      }
    }

    return res.status(200).json({ success: true, report: reports[0] });
  } catch (err) {
    console.error('getReportByEvent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch report.' });
  }
}

async function getAllReports(req, res) {
  try {
    const { club_id, month, year } = req.query;

    let targetClubId = club_id;
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      targetClubId = req.user.club_id;
    }

    let sql = `
      SELECT 
        r.*, 
        e.event_name, 
        e.event_type, 
        e.event_date,
        c.id AS club_id,
        c.club_name,
        c.category AS club_category,
        u.name AS uploaded_by_name
      FROM reports r
      JOIN events e ON r.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON r.uploaded_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (targetClubId && targetClubId !== 'ALL') {
      sql += ` AND c.id = ?`;
      params.push(Number(targetClubId));
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

    sql += ` ORDER BY r.uploaded_at DESC`;

    const [reports] = await query(sql, params);
    return res.status(200).json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error('getAllReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
}

async function downloadReport(req, res) {
  try {
    const reportId = req.params.reportId;
    const [reports] = await query(
      `SELECT r.*, e.club_id, e.event_name, c.club_name 
       FROM reports r 
       JOIN events e ON r.event_id = e.id 
       JOIN clubs c ON e.club_id = c.id 
       WHERE r.id = ?`,
      [reportId]
    );

    if (!reports || reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report record not found.' });
    }

    const report = reports[0];

    // IDOR protection: verify club ownership
    if (req.user.role === 'COORDINATOR' || req.user.role === 'MEMBER') {
      if (Number(report.club_id) !== Number(req.user.club_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access to this report is restricted.' });
      }
    }

    const fullPath = path.join(__dirname, '..', report.file_path);

    // If file is missing on disk, return 404 rather than fabricating fake files
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'Report file is missing from the server.' });
    }

    // RFC 5987 filename encoding to safely support Unicode/Tamil/Hindi characters
    const encodedName = encodeURIComponent(report.file_name);
    res.setHeader('Content-Disposition', `attachment; filename="${report.file_name.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedName}`);
    res.download(fullPath, report.file_name, (err) => {
      if (err && !res.headersSent) {
        console.error('Error in res.download:', err);
        res.status(500).json({ success: false, message: 'Error streaming file.' });
      }
    });
  } catch (err) {
    console.error('downloadReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download report file.' });
  }
}

async function deleteReport(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const reportId = req.params.id;
    const [reports] = await query(
      `SELECT r.*, e.club_id, e.id AS event_id 
       FROM reports r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.id = ?`,
      [reportId]
    );

    if (!reports || reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = reports[0];
    if (req.user.role === 'COORDINATOR' && Number(report.club_id) !== Number(req.user.club_id)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete reports for your club.' });
    }

    // Delete file from disk
    if (report.file_path) {
      const fullPath = path.join(__dirname, '..', report.file_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('Notice: Failed to unlink file:', e.message);
        }
      }
    }

    // Delete record from DB
    await query('DELETE FROM reports WHERE id = ?', [reportId]);

    // Intelligently revert event status: check if event was previously rescheduled
    const [reschedules] = await query('SELECT id FROM event_reschedules WHERE event_id = ?', [report.event_id]);
    const revertedStatus = (reschedules && reschedules.length > 0) ? 'RESCHEDULED' : 'PLANNED';
    await query(`UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [revertedStatus, report.event_id]);

    return res.status(200).json({
      success: true,
      message: `Report deleted successfully. Event status reverted to ${revertedStatus}.`
    });
  } catch (err) {
    console.error('deleteReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }
}

async function updateReport(req, res) {
  try {
    if (req.user.role === 'MEMBER') {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(403).json({ success: false, message: 'Forbidden. Members have read-only access.' });
    }

    const reportId = req.params.id;
    const { description } = req.body;

    const [reports] = await query(
      `SELECT r.*, e.club_id, e.id AS event_id 
       FROM reports r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.id = ?`,
      [reportId]
    );

    if (!reports || reports.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = reports[0];
    if (req.user.role === 'COORDINATOR' && Number(report.club_id) !== Number(req.user.club_id)) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(403).json({ success: false, message: 'Forbidden. You can only update reports for your club.' });
    }

    if (req.file) {
      // Unlink old file
      if (report.file_path) {
        const oldFullPath = path.join(__dirname, '..', report.file_path);
        if (fs.existsSync(oldFullPath)) {
          try { fs.unlinkSync(oldFullPath); } catch (e) {}
        }
      }

      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

      await query(
        `UPDATE reports 
         SET file_name = ?, file_path = ?, file_size = ?, description = ?, uploaded_by = ?, uploaded_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [req.file.originalname, relativePath, req.file.size, description !== undefined ? description : report.description, req.user.id, reportId]
      );
    } else {
      await query(
        `UPDATE reports 
         SET description = ?, uploaded_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [description !== undefined ? description : report.description, reportId]
      );
    }

    // Ensure event is COMPLETED
    await query(`UPDATE events SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [report.event_id]);

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully.'
    });
  } catch (err) {
    console.error('updateReport error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
}

module.exports = {
  uploadReport,
  getReportByEvent,
  getAllReports,
  downloadReport,
  deleteReport,
  updateReport
};

