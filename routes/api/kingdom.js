const express = require('express');
const router = express.Router();
const kingdomController = require('../../controllers/kingdomController');

// Kingdom & Members
router.get('/:id/members', kingdomController.getMembers);
router.post('/members/role', kingdomController.updateRole);

module.exports = router;
