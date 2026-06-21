const express = require('express');
const router = express.Router();
const mapController = require('../../controllers/mapController');

/**
 * @swagger
 * tags:
 *   name: Map
 *   description: Peta dan Wilayah
 */

/**
 * @swagger
 * /api/game/territories:
 *   get:
 *     summary: Get all territories data
 *     tags: [Map]
 *     responses:
 *       200:
 *         description: List wilayah
 */
router.get('/territories', mapController.getTerritories);

module.exports = router;
