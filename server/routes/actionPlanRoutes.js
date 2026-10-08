const { createRouter } = require('../core/router');
const router = createRouter();
const actionPlanController = require('../controllers/actionPlanController');
const { verifyToken, requireCoordinator } = require('../middleware/authMiddleware');

router.get('/', verifyToken, actionPlanController.getActionPlans);
router.post('/', verifyToken, requireCoordinator, actionPlanController.upsertActionPlan);

module.exports = router;
