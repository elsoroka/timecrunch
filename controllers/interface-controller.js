/* interface controller */
// TODO: extend to handle multiple universities
const Course = require('../models/course')
const University = require('../models/university')
const GenericHeatmap = require('./generic-heatmap')
// debug helper to print the type of an object
const toType = function(obj) { return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase() }

// none of these are used right now 
var async = require('async');
const{ body, validationResult } = require('express-validator/check');
const{ sanitizeBody } = require('express-validator/filter');

/* Private */
// Functions which the public facing functions compose into chains 
// The 
const getEmptyHeatmap = (req, res, next) => {
    res.locals.heatmap_object = GenericHeatmap.emptyHeatmapJson();
    next();
};

// The final stage of the route process of a /timecrunch GET request, 
// i.e. a typical scenario of a user landing on the site.
const renderFinal = (req, res) => {
    console.log(res.locals.heatmap_object);
    console.log("called res.render");
	res.render('layout', {title: 'timecrunch', server_data: res.locals.heatmap_object });
};

// The final stage of the route process of a POST request that wants to redraw the heatmap,
// i.e. a typical scenario of a user interacting with the input form 
// or the initial arrival to an empty heatmap
const sendHeatmapJson = (req, res) => {
    console.log(res.locals.heatmap_object);
    console.log("set heatmapJson via res.json");
    res.json(res.locals.heatmap_object);
};


const executeQuery = (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (!errors.isEmpty()) 
    {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('timecrunch_interface', { title: 'Search Demographics:' } ); // TODO: errors: errors.array() } );
        return;
    }
    // No errors
    
    // debug messages
    console.log(`executyQuery:37:req.body=${req.body}`);
    console.log(`executyQuery:37:req.body=${JSON.stringify(req.body)}`);
    console.log(`executyQuery:38:req.body.university=${req.body.university}`)
    console.log(`executyQuery:39:req.body.selections=${req.body.selections}`)
    console.log(toType(req.body.selections));
    console.log(req.body.selections);


    /*
    let departments = req.body.departments.split(',');//JSON.parse('[' + req.body.departments + ']');
    let divisions = req.body.divisions.split(',');
    console.log(departments);
    if (Array.isArray(req.body.departments)) console.log(`isarray`);
    if (Array.isArray(departments)) console.log(`isarray=${departments}`);
    */
    // end debug

    
    let union_of_conditions = []
    /*
     * Build OR'd Query
     */
    req.body.selections.forEach(selection => {
        // selection := {departments: [...], divisions:[...]} where [] means ANY
        if (selection.divisions.length == 0) {
            selection.departments.forEach(dept_name => 
                union_of_conditions.push({department: dept_name})
            );
        }
        else if (selection.departments.length == 0) {
            selection.divisions.forEach(div_name => 
                union_of_conditions.push({division: div_name})
            );
        }
        else {
            // deps X divs
            selection.departments.forEach(dept_name => {
                selection.divisions.forEach(div_name => {
                    union_of_conditions.push({department: dept_name, division: div_name})
                })
            });
        }
    });
    console.log(`conditions=${JSON.stringify(union_of_conditions)}`);

    // The latter would look like conditions = [{division: 'lower', department: 'Math'}, {division: 'upper', department: 'CS'}] 
    let for_university = { university: req.body.university }; 
    // Build the query to get all courses 
    let course_query = Course.find().or(union_of_conditions).orFail();//new Error("No courses found")); 
    // Run the query, exec returns a Promise
    course_query.exec( function(err, courses) {
        if (err) return next(err); // TODO: catch and handle error: "No courses found" 

        if (!courses) {
            res.locals.heatmap_object = GenericHeatmap.getEmptyHeatmapJson();
            next()
        }

        console.log("COURSES:");
        console.log(courses);
        hm = new GenericHeatmap(10); // timestep of 10 minutes
        hm.fill(courses); //2d array populated with the course info
       // let heatmap_dict = heatmap_data //view_dict(heatmap_data);
        // ELS: Not sure what this is so I temporarily added the old render call
        // res.render('timecrunch_interface_with_heatmap_data', heatmap_dict);
        res.locals.heatmap_object = {
            init: "false",
            weekdayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            timeIncrements: hm.incrementLabels,
            heatmap: hm.heatmap 
        };
        console.log("interfaceController:: about to render heatmap");
        next();
    });
};

/*  public controller functions */
/*
 * These are arrays of functions representing an express route chain 
 * (i.e. connected via next() call)
 * and ending with renderFinal, which renders the layout.pug file
 */

// allows the user to set the school and populate the available demographics, 
// e.g. the departments and divisions
exports.setSchool = 
[
    //TODO: send the divisions
    (req, res) => {
        if (req.query && req.query.university_name)
        {
            let universityName = req.query.university_name.toLowerCase();
            console.log(`Setting school to ${universityName}`);
            University.findOne({name: universityName}, function(err, university) {
                console.log("may have found a university");
                if (err) {
                    console.log("error finding univesity");
                    return next(err);
                }
                console.log(university.departments);
                console.log(university.divisions);
                res.json({departments: university.departments, divisions: university.divisions});
                return;
            });
        }
    }
];

exports.initializePage = [
    getEmptyHeatmap,
    renderFinal
    /*
    (req, res) => {
        res.render('layout', {title: 'timecrunch', server_data: {init: "init"}});
            //, server_data: res.locals.heatmap_object });
    }
    */
];

// Initiallly empty heatmap
exports.renderEmptyHeatmap =
[
    getEmptyHeatmap,
    sendHeatmapJson
];

// execute user query on POST (user-facing form submission)
exports.renderHeatmap = 
[
    // TODO: Validation, but maybe do this client-side instead
    // i.e. validate at least one demographic sent
	// Process request after validation and sanitization.
    executeQuery,
    sendHeatmapJson
];

