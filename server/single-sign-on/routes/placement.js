const { createRouter } = require('../../core/router');
const router = createRouter();
const { handlePlacementSSO } = require('../controllers/placement.controller');

router.get('/sso', handlePlacementSSO);

module.exports = router;

