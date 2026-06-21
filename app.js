var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const compression = require('compression');
require('dotenv').config();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api/index');

BigInt.prototype.toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

var app = express();

// views removed

app.use(compression());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/maps', express.static(path.join(__dirname, 'maps')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter); 
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // send json error response
  res.status(err.status || 500);
  res.json({ error: err.message, status: err.status || 500 });
});

module.exports = app;
// Trigger nodemon reload: 2026-06-20 (stamina and slots update)