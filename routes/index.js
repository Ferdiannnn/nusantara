var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('/map');
});

router.get('/map', function(req, res, next) {
  res.sendFile(require('path').join(__dirname, '../public/map.html'));
});

module.exports = router;
