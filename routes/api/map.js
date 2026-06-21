const express = require('express');
const router = express.Router();
const mapController = require('../../controllers/mapController');

router.get('/territories', mapController.getTerritories);

module.exports = router;
