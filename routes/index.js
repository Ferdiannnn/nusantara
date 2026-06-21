var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('http://localhost:3001');
});

router.get('/map', function(req, res, next) {
  res.redirect('http://localhost:3001/map');
});

module.exports = router;

