const { createRouter } = require('../core/router');
const router = createRouter();
const clubController = require('../controllers/clubController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, clubController.getClubs);
router.get('/:id', verifyToken, clubController.getClubById);
router.post('/', verifyToken, requireAdmin, clubController.createClub);
router.put('/:id', verifyToken, requireAdmin, clubController.updateClub);

module.exports = router;

