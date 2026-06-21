const express = require('express');
const router = express.Router();
const battleController = require('../../controllers/battleController');

router.post('/declare_war', battleController.declareWar);
router.post('/help_attack', battleController.helpAttack);
router.post('/defend_territory', battleController.defendTerritory);

module.exports = router;
