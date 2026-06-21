const express = require('express');
const router = express.Router();
const battleController = require('../../controllers/battleController');

/**
 * @swagger
 * tags:
 *   name: Battle
 *   description: Sistem Pertempuran Wilayah
 */

/**
 * @swagger
 * /api/game/declare_war:
 *   post:
 *     summary: Declare war on a territory
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Perang dideklarasikan
 */
router.post('/declare_war', battleController.declareWar);

/**
 * @swagger
 * /api/game/help_attack:
 *   post:
 *     summary: Help attack a territory
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Serangan berhasil
 */
router.post('/help_attack', battleController.helpAttack);

/**
 * @swagger
 * /api/game/defend_territory:
 *   post:
 *     summary: Help defend a territory
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Pertahanan berhasil
 */
router.post('/defend_territory', battleController.defendTerritory);

module.exports = router;
