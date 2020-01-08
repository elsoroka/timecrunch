#! /usr/bin/env node
const fs = require('fs')
const async = require('async')
const mongoose = require('mongoose');
const Course = require('../models/course')
const UciScraper = require('./scrapers/uci-scraper')
const StanfordScraper = require('./scrapers/stanford-scraper')
const scrapers = [UciScraper, StanfordScraper]

const userArgs = process.argv.slice(2);

let universityDataDir = './bin/university-data';

console.log('Read ./bin/university_data/<schoolname>.json to update database with course data. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0-mbdj7.mongodb.net/local_library?retryWrites=true');

let universities = []
let courses = []

//console.log(userArgs);
// Get arguments passed on command line
if (userArgs.length > 0 && !userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return -1;
}

let mongoDB = userArgs.length > 1 ? userArgs[0] : 'mongodb+srv://timecrunchDb:timecr0mchl0l!@timecrunch-zc0o8.azure.mongodb.net/test?retryWrites=true&w=majority';

// set these to stop deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// sleep function to delay between scraper calls
const sleep = ms => new Promise(r => setTimeout(r, ms));

// course___() might be better encapsulted within models/course schema as a static function
// upsert is true which means it will find the course and update it or create a new course if not present
function courseUpsert(course) {
    // option "new" set to true means it will return the updated version instead of the original
    Course.findOneAndUpdate(courseinfo, {sections: sections}, {new: true, upsert: true}, 
        function (err, course) {
            if (err) 
                return;
            console.log(`${course.university}:: New or Updated Course: ${course}`);
        });
}

async function runScraper(scraper) {

    let scraperResult = {
        schoolName: scraper.name(),
        totalCourses: 0
    };
    const depts  = scraper.departments();
    const levels = scraper.levels();
    const term   = scraper.currentTerm();
    //TODO: more validation for options
    if (term === "") {
        scraperResult.error = "No term selected";
        return scraperResult;
    }
    depts.forEach(deptName => {
        if (deptName == "") return; 
        levels.forEach(division => {
            if (division === "") return; 
            // i suspect this never happens, dd -max
            let options = {
                term: term,
                department: deptName,
                division: division
            };
            await sleep(1000);
            scraper.run(options).then(courses => {
                scraperResult.totalCourses += len(courses)
                courses.forEach(course => courseCreate(course)); //console.log(course) //console.log(courseTitle, courseNumber);
            });
        });
    });
    return scraperResult; 
}

async function populateDB(scrapers, options) {
    // run each scraper asynchronously
    //return when finished with all scrapers
    return Promise.all(scrapers.map(scraper => runScraper(scraper)))
}

populateDB(scrapers).then(scraperResults => {
    scraperResults.forEach(res => 
        console.log(`School: ${res.schoolName} -- Total Courses added to DB: ${res.totalCourses}`);
    );
    mongoose.connection.close();
})

