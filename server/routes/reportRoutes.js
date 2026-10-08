const { createRouter } = require('../core/router');
const router = createRouter();
const reportController = require('../controllers/reportController');
const { verifyToken, requireCoordinator } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Coordinator uploads report for completed event
router.post('/upload/:eventId', verifyToken, requireCoordinator, upload.single('report_file'), reportController.uploadReport);

// Update / Replace report
router.put('/:id', verifyToken, upload.single('report_file'), reportController.updateReport);

// Delete report
router.delete('/:id', verifyToken, reportController.deleteReport);

// View metadata
router.get('/', verifyToken, reportController.getAllReports);
router.get('/event/:eventId', verifyToken, reportController.getReportByEvent);

// Download report file directly (Protected)
router.get('/download/:reportId', verifyToken, reportController.downloadReport);

module.exports = router;

