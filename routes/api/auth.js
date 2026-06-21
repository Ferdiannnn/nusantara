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
/**
 * @swagger
 * /api/game/change_password:
 *   post:
 *     summary: Change player password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               player_id:
 *                 type: integer
 *               old_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil ganti password
 */
router.post('/change_password', authController.changePassword);
/**
 * @swagger
 * /api/game/player/{id}:
 *   get:
 *     summary: Get player profile
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data player
 */
router.get('/player/:id', authController.getPlayer);
/**
 * @swagger
 * /api/game/kingdoms:
 *   get:
 *     summary: Get all kingdoms list
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List kingdoms
 */
router.get('/kingdoms', authController.getKingdoms);
/**
 * @swagger
 * /api/game/upgrade_skill:
 *   post:
 *     summary: Upgrade player skill
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               player_id:
 *                 type: integer
 *               skill_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skill upgraded
 */
router.post('/upgrade_skill', authController.upgradeSkill);

module.exports = router;
