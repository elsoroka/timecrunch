var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var indexRouter = require('./routes/index');
var timecromch = require('./routes/timecromch');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// logger
app.use(logger('dev'));

// set up express and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
// Tell Mongoose to use global promise library
mongoose.Promise = global.Promise 
// Connect mongoose to mongoDB cloud atlas server
var mongoDB = 'mongodb+srv://timecrunchDb:timecr0mchl0l!@timecrunch-zc0o8.azure.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(mongoDB)
// Get handle to default connection
var db = mongoose.connection 
// Bind connection to error event to get notification of connection erros
db.on('error', console.error.bind(console, 'Cloud MongoDB Atlas connection error:'));
// END Database Setup

app.use('/', indexRouter);
app.use('/timecromch', timecromch);

// Error Catching
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
