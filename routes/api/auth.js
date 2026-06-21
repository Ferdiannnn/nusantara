const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autentikasi dan Manajemen Player
 */

/**
 * @swagger
 * /api/game/register:
 *   post:
 *     summary: Register a new player
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - kingdom_id
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               kingdom_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Berhasil daftar
 *       400:
 *         description: Input tidak valid
 */
router.post('/register', authController.register);
/**
 * @swagger
 * /api/game/login:
 *   post:
 *     summary: Login for a player
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil login
 *       401:
 *         description: Kredensial salah
 */
router.post('/login', authController.login);
router.post('/change_password', authController.changePassword);
router.get('/player/:id', authController.getPlayer);
router.get('/kingdoms', authController.getKingdoms);
router.post('/upgrade_skill', authController.upgradeSkill);

module.exports = router;
