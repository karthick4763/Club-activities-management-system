const { createRouter } = require('../core/router');
const router = createRouter();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireAdmin, requireClubMemberOrCoordinator } = require('../middleware/authMiddleware');

router.get('/admin', verifyToken, requireAdmin, dashboardController.getAdminDashboard);
router.get('/coordinator', verifyToken, requireClubMemberOrCoordinator, dashboardController.getCoordinatorDashboard);

module.exports = router;
