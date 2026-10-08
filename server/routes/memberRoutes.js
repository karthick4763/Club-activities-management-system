const { createRouter } = require('../core/router');
const router = createRouter();
const memberController = require('../controllers/memberController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, memberController.getMembers);
router.post('/', verifyToken, memberController.addMember);
router.post('/bulk', verifyToken, memberController.bulkAddMembers);
router.put('/:id/approve', verifyToken, requireAdmin, memberController.approveMember);
router.put('/:id/reject', verifyToken, requireAdmin, memberController.rejectMember);
router.put('/:id/status', verifyToken, requireAdmin, memberController.updateMemberStatus);
router.put('/:id/role', verifyToken, memberController.toggleMemberRole);
router.delete('/:id', verifyToken, memberController.deleteMember);

module.exports = router;

