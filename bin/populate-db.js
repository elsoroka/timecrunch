#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const async = require('async')
const mongoose = require('mongoose');
const Course = require('../models/course')
const University = require('../models/university')
const StanfordScraper = require('./scrapers/stanford-scraper.js')
const UciScraper = require('./scrapers/uci-scraper.js')

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
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// one-off to add stanford to the DB 
db.once('open', uploadUniversityObject);
// hotfix: stanford courses have a trailing semi-colon
//db.once('open', hotfixFixCourseNumberStanford);
function hotfixFixCourseNumberStanford(){
    var fixedCourses = []
    Course.find({university: "stanford"}).cursor()
        .on('data', function(doc){
            if (doc.courseNumber.includes(":")){
                console.log(doc.courseNumber);
                doc.courseNumber = doc.courseNumber.replace(/:$/, "");
                fixedCourses.push(doc)
            }
        })
        .on('end', function() {
            console.log(`end::courses to fix:${fixedCourses.length}`);
            async.each(fixedCourses, 
                async function(course, _) {
                    console.log(course);
                    await course.save();
                }, 
                function(err) {
                  if (err) return console.log(err);
                    console.log("db closing");
                    db.close();
                });
        });
};

// Delay used to slow down between page requests.
function wait(ms, value) {
    return new Promise(resolve => setTimeout(resolve, ms, value));
}

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
                            console.log("\n\n")
                            console.log(JSON.stringify(cls))
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
    // TODO: Figure out where to put this so it doesn't cause a concurrency error.
    //db.close();
 }


scraper = UciScraper
name = "uci"
function uploadUniversityObject(){
    const conditions = {university: name};
    console.log(conditions);
    Course.find(conditions, function(err, courses){
        if (err) return console.error(err);
        console.log("RECEIVED", courses.length, "results");

        courseIds = []
        courses.forEach(course => courseIds.push(course._id));
        let university = new University({
            //name: scraper.name().toLowerCase(),
            name: name,
            departments: scraper.departments(),
            divisions: scraper.levels(),
            courses: courseIds
        });
        university.save( function(err, uni){
            if (err) return console.error(err);
            console.log(`saved:\n ${uni.name.toLowerCase()}`);
            mongoose.connection.close();
        });
    })
}

let path_to_university_json = './bin/university-data/UC Irvine';
readUniversityData(path_to_university_json, finish);
//uploadUniversityObject(StanfordScraper, 'stanford'), finish);


