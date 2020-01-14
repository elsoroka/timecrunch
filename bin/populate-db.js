#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const async = require('async')
const mongoose = require('mongoose');
const Course = require('../models/course')
const University = require('../models/university')
const StanfordScraper = require('./scrapers/stanford-scraper.js')

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
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function courseCreate(uni, div, dept, number, title, sections, cb) {
    let courseinfo = {
        university: uni, 
        division: div, 
        department: dept, 
        courseNumber: number,
        courseTitle: title, 
    };

    //console.log(sections);
    // create array of  parsed sections
    // We don't need this anymore because the JSON file is already parsed. The parsing is moved to uci-scraper.js ~emi
    // const parsed_sections = Course.parseSections(sections);
    // if (parsed_sections == null) {
    //     return;
    // }

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
    const dir = await fs.promises.opendir(path);
    for await (const dirent of dir) {
        console.log("File", dirent.name)
        fs.readFile(path + '/' + dirent.name, (err, data) => {
            if (err) {
                cb(err, null);
                return
            }
            else {
                let uni_json = JSON.parse(data);
                let uni_name = dirent.name.substr(0, dirent.name.lastIndexOf('.')); // TODO: we should store the name in the file instead to cleanly handle special chars
                let div, dept, cls, courseNumber, courseTitle, section
                //console.log(uni_name);
                for (div in uni_json) {
                    //console.log(div)
                    for (dept in uni_json[div]) {
                        //console.log(dept)
                        for (course_index in uni_json[div][dept]){
                            cls = uni_json[div][dept][course_index]
                            //console.log(cls)
                            courseNumber = cls.courseNumber
                            courseTitle = cls.courseTitle
                            //console.log(courseTitle, courseNumber);
                            courseCreate(uni_name, div, dept, courseNumber, courseTitle, cls.sections, cb);
                        }
                    }
                }
            }
        });
    }
}

function readUniversityData(path, cb){
   load_courses_all_universities(path, cb).catch(console.error);
}

function finish(err, results) {
    if (err) 
        console.log('FINAL ERR: '+err);
    else {
        console.log('CourseInstances: '+ results);
    }
    // All done, disconnect from database
    // HACK! TODO: Figure out where to put this!
    // it should close at the END of the connection!
    // Right here it will close at some random point and break the uploading.
    // ~emi
    // mongoose.connection.close();
}

async function uploadUniversityObject(scraper, name, cb){
    const conditions = {university:name};
    const projection = {_id:1};
    let query = Course.find(conditions, projection);
    console.log(conditions);
    let result = await query.exec( function(err, courses) {
        console.log("RECEIVED", courses.length, "results");
        let university = {
            name: scraper.name(),
            departments: scraper.departments(),
            divisions: scraper.levels(),
            courses: courses,
        };
        University.findOneAndUpdate({university:name}, university, {new:true, upsert: true},
            function (err, result) {
                console.log("Result", result);
                console.log("Added object for", scraper.name());
                //cb(); // TODO: Why does it crash?
            });
    });
}

//let path_to_university_json = './bin/university-data';
//readUniversityData(path_to_university_json, finish);

uploadUniversityObject(StanfordScraper, 'stanford', mongoose.connection.close);
