#! /usr/bin/env node
const fs = require('fs')
const async = require('async')
const Course = require('../models/course')
let universities = []
let courses = []
const userArgs = process.argv.slice(2);


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
    courseinfo.sections = Course.parseSections(sections);
    let course = new Course(courseinfo);
    console.log(course.sections[0].meetings);
    course.save( function (err) {
        if (err) {
            cb(err, null);
            return;
        }
        console.log('New Course: ' + course);
        //courses.push(course);
        cb(null, course)
    });
}


async function ls(path, cb) {
    const dir = await fs.promises.opendir(path)
    for await (const dirent of dir) {
        console.log(dirent.name)
        fs.readFile(path + '/' + dirent.name, (err, data) => {
            if (err) {
                cb(err, null);
                console.log(err);
            }
            else {
                let uni_json = JSON.parse(data);
                let uni_name = dirent.name.substr(0, dirent.name.lastIndexOf('.')); // TODO: we should store the name in the file instead to cleanly handle special chars
                let div, dept, cls, courseNumber, courseTitle, section
                console.log(uni_name);
                for (div in uni_json) {
                    //console.log(div)
                    for (dept in uni_json[div]) {
                        //console.log(dept)
                        for (course_index in uni_json[div][dept]){
                            cls = uni_json[div][dept][course_index]
                            //console.log(cls)
                            courseNumber = cls.courseNumber
                            courseTitle = cls.courseTitle
                            courseCreate(uni_name, div, dept, courseNumber, courseTitle, cls.sections, cb);
                        }
                    }
                }
                //console.log(uni_json);
                //console.log(uni_json.lower['STATS'][1]['sections'][0]); //enrolled / meetings[]
                //courseCreate(uni_name, 
                //universities.push(uni_json);
                //cb(null, uni_json);
            }
        });
    }
}

function readUniversityData(cb){
    ls('./bin/university_data', cb).catch(console.error)
}

function profit(err, results) {
    if (err) 
        console.log('FINAL ERR: '+err);
    else {
        console.log('CourseInstances: '+ results);
    }
    //console.log(universities);
    console.log(1);
}

async.series([readUniversityData], profit);
/*
const fs = require('fs')
const dir = fs.opendirSync('./scrapers/data/universities/') // uci.json , stanford.json , etc..
var university_json = []
let dirent
while ((dirent = dir.readSync()) !== null) {
    console.log(dirent.name)
    //university_json.push(require(dirent.name));
}
dir.closeSync()
async.series([
    createBookInstances
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('CourseInstances: '+ courseInstances);
    }
    // All done, disconnect from database
    mongoose.connection.close();
});
*/
