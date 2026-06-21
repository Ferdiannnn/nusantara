const express = require('express');
const router = express.Router();
const kingdomController = require('../../controllers/kingdomController');

/**
 * @swagger
 * tags:
 *   name: Kingdom
 *   description: Manajemen Kerajaan
 */

/**
 * @swagger
 * /api/game/kingdoms/{id}/members:
 *   get:
 *     summary: Get members of a kingdom
 *     tags: [Kingdom]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of members
 */
router.get('/:id/members', kingdomController.getMembers);

/**
 * @swagger
 * /api/game/kingdoms/members/role:
 *   post:
 *     summary: Update member role
 *     tags: [Kingdom]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.post('/members/role', kingdomController.updateRole);

module.exports = router;
