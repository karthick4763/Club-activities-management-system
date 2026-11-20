const { createRouter } = require('../../core/router');
const router = createRouter();
const { handleClubSSO } = require('../controllers/club.controller');

router.get('/sso', handleClubSSO);

module.exports = router;

