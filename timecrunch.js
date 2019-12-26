// TODO: these are const
const createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// TODO: const
var indexRouter = require('./routes/index');
var timecromchRouter = require('./routes/timecromch');
var timecrunchInterfaceRouter = require('./routes/timecrunch-interface');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// logger
app.use(logger('dev'));

// set up express and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
// set these to stop deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
// Tell Mongoose to use global promise library
mongoose.Promise = global.Promise 
// Connect mongoose to mongoDB cloud atlas server
var mongoDB = 'mongodb+srv://timecrunchDb:timecr0mchl0l!@timecrunch-zc0o8.azure.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(mongoDB)
// Get handle to default connection
var db = mongoose.connection 
// Bind connection to error event to get notification of connection erros
db.on('error', console.error.bind(console, 'Cloud MongoDB Atlas connection error:'));
/* ad-hoc temporary code needed to store uci department/divisions in DB
db.once('open', function() {
    const Course = require('./models/course');
    const University = require('./models/university');
    let departments = new Set();
    let divisions = new Set();
    let universityNames = new Set();
    let courseIds = [];
    //let uniData = {};
    let cursor = Course.find().cursor();
    cursor.on('data', function(course) {
        universityNames.add(course.university);
        divisions.add(course.division);
        departments.add(course.department);
        courseIds.push(course._id);
    });
    cursor.on('close', function() {
        let uniData = {
            name: "uci"
        }
        uniData.divisions = Array.from(divisions);
        uniData.departments = Array.from(departments);
        uniData.courses = courseIds;
        // a university intance 
        let uci = new University(uniData);
        uci.save(function(err, university){
            if (err) return console.eror(err);
            console.log(`${university.name} saved to university collection.`);
        });
    });

});
*/

// END Database Setup

app.use('/', indexRouter);
app.use('/timecromch', timecromchRouter); // working prototype
app.use('/timecrunch', timecrunchInterfaceRouter); //aspiring finished interface

// Error Catching
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    console.log(`error handler running`);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
