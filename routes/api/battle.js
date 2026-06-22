const express = require('express');
const router = express.Router();
const battleController = require('../../controllers/battleController');

/**
 * @swagger
 * tags:
 *   name: Battle
 *   description: Sistem Pertempuran 3 Ronde
 */

/**
 * @swagger
 * /api/game/declare_war:
 *   post:
 *     summary: Declare war on a territory (creates Battle + Round 1)
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Perang dideklarasikan, ronde 1 dimulai
 */
router.post('/declare_war', battleController.declareWar);

/**
 * @swagger
 * /api/game/help_attack:
 *   post:
 *     summary: Bantu serangan – akumulasi damage, trigger tick tiap 2 menit
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Serangan berhasil, state ronde dikembalikan
 */
router.post('/help_attack', battleController.helpAttack);

/**
 * @swagger
 * /api/game/defend_territory:
 *   post:
 *     summary: Bantu pertahanan – akumulasi damage, trigger tick tiap 2 menit
 *     tags: [Battle]
 *     responses:
 *       200:
 *         description: Pertahanan berhasil, state ronde dikembalikan
 */
router.post('/defend_territory', battleController.defendTerritory);

/**
 * @swagger
 * /api/game/battle_status/{territory_code}:
 *   get:
 *     summary: Get status ronde dan poin pertempuran aktif di sebuah wilayah
 *     tags: [Battle]
 *     parameters:
 *       - name: territory_code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status pertempuran
 */
router.get('/battle_status/:territory_code', battleController.getBattleStatus);

/**
 * @swagger
 * /api/game/process_tick/{territory_code}:
 *   post:
 *     summary: Proses tick pertempuran jika 2 menit sudah lewat (dipanggil otomatis dari frontend saat countdown = 0)
 *     tags: [Battle]
 *     parameters:
 *       - name: territory_code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hasil tick
 */
router.post('/process_tick/:territory_code', battleController.processTick);

module.exports = router;
