#! /usr/bin/env node
const fs = require('fs')
const async = require('async')
const mongoose = require('mongoose');
const Course = require('../models/course')
const UciScraper = require('./scrapers/uci-scraper')
const StanfordScraper = require('./scrapers/stanford-scraper')

const userArgs = process.argv.slice(2);

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

function courseCreate(uni, div, dept, number, title, sections, cb) {
    let courseinfo = {
        university: uni, 
        division: div, 
        department: dept, 
        courseNumber: number,
        courseTitle: title, 
    };

    // upsert is true which means it will find the course and update it or create a new course if not present
    // option "new" set to true means it will return the updated version instead of the original
    Course.findOneAndUpdate(courseinfo, {sections: sections}, {new: true, upsert: true}, 
        function (err, course) {
            if (err) {
                cb(err, null);
                return;
            }
            console.log('New or Update Course: ' + course);
            //courses.push(course);
            cb(null, course)
            return;
        }
    );
}

async function load_courses_all_universities(path, cb) {
    const dir = await fs.promises.opendir(path)
    for await (const dirent of dir) {
        console.log(dirent.name)
        fs.readFile(path + '/' + dirent.name, (err, data) => {
            if (err) {
                cb(err, null);
                return
            }
            else {
                let uniJson = JSON.parse(data);
                let uniName = dirent.name.substr(0, dirent.name.lastIndexOf('.')); // TODO: we should store the name in the file instead to cleanly handle special chars
                let div, dept, cls, courseNumber, courseTitle, section
                //console.log(uniName);
                for (div in uniJson) {
                    //console.log(div)
                    for (dept in uniJson[div]) {
                        //console.log(dept)
                        for (course_index in uniJson[div][dept]){
                            cls = uniJson[div][dept][course_index]
                            //console.log(cls)
                            courseNumber = cls.courseNumber
                            courseTitle = cls.courseTitle
                            //console.log(courseTitle, courseNumber);
                            courseCreate(uniName, div, dept, courseNumber, courseTitle, cls.sections, cb);
                        }
                    }
                }
            }
        });
    }
}

function readUniversityData(path, cb) {
   load_courses_all_universities(path, cb).catch(console.error)
}

function finish(err, results) {
    if (err) 
        console.log('FINAL ERR: '+err);
    else {
        console.log('CourseInstances: '+ results);
    }
    // All done, disconnect from database
    mongoose.connection.close();
}

async function runScraper() {
    let schoolJson = {};
    depts  = scraper.departments();
    levels = scraper.levels();
    term   = scraper.currentTerm();
    // fill in the levels for schoolJson
    levels.forEach((level,_) => schoolJson[level] = {});
    depts.forEach((deptName, deptDelay) => {
        if (deptName != "") {
            levels.forEach((division, divDelay) => {
                let options = {
                    term: term,
                    department: deptName,
                    division: division
                };
                await sleep(deptDelay*5000 + divDelay*1000);
                scraper.run(options).then(writeJsonToFile);
            });
        }
    });
}

function scraperControl(scrapers) {
    // for the each scraper, call scraper.run()
    scrapers.forEach(scraper => {
        let schoolJson = {};
        depts  = scraper.departments();
        levels = scraper.levels();
        term   = scraper.currentTerm();
        runScraper(scraper);
    });
}

let path_to_university_json = './bin/university-data';
readUniversityData(path_to_university_json, finish)

