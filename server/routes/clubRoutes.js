const { createRouter } = require('../core/router');
const router = createRouter();
const clubController = require('../controllers/clubController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, clubController.getClubs);
router.get('/:id', verifyToken, clubController.getClubById);
router.post('/', verifyToken, requireAdmin, clubController.createClub);
router.put('/:id/baseline', verifyToken, clubController.updateClubBaseline);
router.put('/:id', verifyToken, clubController.updateClub);

module.exports = router;

