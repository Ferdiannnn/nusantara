const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

// Auth & Player
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/player/:id', authController.getPlayer);
router.get('/kingdoms', authController.getKingdoms);
router.post('/upgrade_skill', authController.upgradeSkill);

module.exports = router;
