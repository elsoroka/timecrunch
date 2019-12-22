#! /usr/bin/env node
const fs = require('fs')
const async = require('async')
let universities = []
let courses = []
const userArgs = process.argv.slice(2);
/*
console.log('This script populates some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0-mbdj7.mongodb.net/local_library?retryWrites=true');

// Get arguments passed on command line
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return -1;
}
const async = require('async')
const Course = require('../models/course')
const mongoose = require('mongoose');
let mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


function createGenreAuthors(cb) {
    async.series([
        function(callback) {
          authorCreate('Patrick', 'Rothfuss', '1973-06-06', false, callback);
        },
        function(callback) {
          authorCreate('Ben', 'Bova', '1932-11-8', false, callback);
        },
        function(callback) {
          authorCreate('Isaac', 'Asimov', '1920-01-02', '1992-04-06', callback);
        },
        function(callback) {
          authorCreate('Bob', 'Billings', false, false, callback);
        },
        function(callback) {
          authorCreate('Jim', 'Jones', '1971-12-16', false, callback);
        },
        function(callback) {
          genreCreate("Fantasy", callback);
        },
        function(callback) {
          genreCreate("Science Fiction", callback);
        },
        function(callback) {
          genreCreate("French Poetry", callback);
        },
        ],
        // optional callback
        cb);
}

function createBooks(cb) {
    async.parallel([
        function(callback) {
          bookCreate('The Name of the Wind (The Kingkiller Chronicle, #1)', 'I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.', '9781473211896', authors[0], [genres[0],], callback);
        },
        function(callback) {
          bookCreate("The Wise Man's Fear (The Kingkiller Chronicle, #2)", 'Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.', '9788401352836', authors[0], [genres[0],], callback);
        },
        function(callback) {
          bookCreate("The Slow Regard of Silent Things (Kingkiller Chronicle)", 'Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.', '9780756411336', authors[0], [genres[0],], callback);
        },
        function(callback) {
          bookCreate("Apes and Angels", "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...", '9780765379528', authors[1], [genres[1],], callback);
        },
        function(callback) {
          bookCreate("Death Wave","In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...", '9780765379504', authors[1], [genres[1],], callback);
        },
        function(callback) {
          bookCreate('Test Book 1', 'Summary of test book 1', 'ISBN111111', authors[4], [genres[0],genres[1]], callback);
        },
        function(callback) {
          bookCreate('Test Book 2', 'Summary of test book 2', 'ISBN222222', authors[4], false, callback)
        }
        ],
        // optional callback
        cb);
}


import * as 
const fs = require('fs');
var json = require('./data.json')

    //
function createCourses(cb) {
    // load final.json
    var json = 
    async.parallel([
        function(callback) {
          createCourse(books[0], 'London Gollancz, 2014.', false, 'Available', callback)
        },
        function(callback) {
          bookInstanceCreate(books[1], ' Gollancz, 2011.', false, 'Loaned', callback)
        },
        function(callback) {
          bookInstanceCreate(books[2], ' Gollancz, 2015.', false, false, callback)
        },
        function(callback) {
          bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
        },
        function(callback) {
          bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
        },
        function(callback) {
          bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
        },
        function(callback) {
          bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Available', callback)
        },
        function(callback) {
          bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Maintenance', callback)
        },
        function(callback) {
          bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Loaned', callback)
        },
        function(callback) {
          bookInstanceCreate(books[0], 'Imprint XXX2', false, false, callback)
        },
        function(callback) {
          bookInstanceCreate(books[1], 'Imprint XXX3', false, false, callback)
        }
        ],
        // Optional callback
        cb);
}

var functions = {};
var behaviorsNames = ['behavior1', 'beahvior2'];
var behaviorsBodies = ['this.x++', 'this.y++'];
for (var i = 0; i < behaviorsNames.length; i++){
    functions[behaviorsNames[i]] =  new Function(behaviorsBodies[i]);
}

//run a function
functions.behavior1();
*/


function courseCreate(uni, div, dept, title, number, sections, cb) {
    courseinfo = {
        university: uni, 
        division: div, 
        department: dept, 
        courseTitle: title, 
        courseNumber: number,
        sections: sections
    };
    let course = new Course(courseinfo);
    course.save( function (err) {
        if (err) {
            cb(err, null);
            return;
        }
        console.log('New Course: ' + course);
        courses.push(course);
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
                let uni_name = dirent.name.substr(0, dirent.name.lastIndexOf('.'));
                let div, dept, cls, courseNumber, courseTitle, section
                console.log(uni_name);
                for (div in uni_json) {
                    console.log(div)
                    for (dept in uni_json[div]) {
                        console.log(dept)
                        for (course_index in uni_json[div][dept]){
                            cls = uni_json[div][dept][course_index]
                            console.log(cls)
                            courseNumber = cls.courseNumber
                            courseTitle = cls.courseTitle
                            courseCreate(uni_name, dept, 
                            for (section_index in cls.sections)
                                section = cls.sections[section_index]
                                console.log(section)
                        }

                    }
                }
                //console.log(uni_json);
                //console.log(uni_json.lower['STATS'][1]['sections'][0]); //enrolled / meetings[]
                //courseCreate(uni_name, 
                universities.push(uni_json);
                cb(null, uni_json);
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
