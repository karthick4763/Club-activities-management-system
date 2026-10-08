const { createRouter } = require('../core/router');
const router = createRouter();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, eventController.getEvents);
router.post('/', verifyToken, eventController.createEvent);
router.put('/:id', verifyToken, eventController.updateEvent);
router.put('/:id/status', verifyToken, eventController.toggleEventStatus);
router.post('/:id/reschedule', verifyToken, eventController.rescheduleEvent);
router.get('/:id/reschedules', verifyToken, eventController.getRescheduleHistory);
router.delete('/:id', verifyToken, eventController.deleteEvent);

module.exports = router;
