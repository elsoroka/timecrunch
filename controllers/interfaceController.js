/* interface controller */
// TODO: extend to handle multiple universities
var Course = require('../models/course')

// none of these are used right now 
var async = require('async');
const{ body, validationResult } = require('express-validator/check');
const{ sanitizeBody } = require('express-validator/filter');

/*  public controller functions */

// execute user query on POST (user-facing form submission)
exports.exec_query = [
    // TODO: Validate that at least one department (or other demographic category) was selected
	// example of validation of string length (not array length) :thonking: 
	// body('department', 'Department name is required!').isLength({min: 1}).trim(),
	// Process request after validation and sanitization.
	(req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        if (!errors.isEmpty()) 
		{
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('timecrunch_interface', { title: 'Search Demographics:' } ); // TODO: errors: errors.array() } );
			return;
        }
		// No errors
        console.log("starting to crunch some data");
		let demographics = req.body.dept_names;
        let departments = demographics; // assume demographics is an array of departments TODO: allow for specific divisions also
        // let divisions = division;
        let for_university = { university: "UCI" } // TODO: allow user to choose university
        // Build the query to get all courses 
        let course_query = Course.
            find(for_university).
            where('department').in(departments);
            //where('divisions').in(divisions);

        course_query.exec( function(err, courses) {
			if (err)
				return next(err);
            if (courses)
            {
                console.log("COURSES:");
                console.log(courses);
                // FAKE DATA, REMOVE
                courses = [
                {"timeIsTBA":false,
                 "startTime":8*60, // 8am
                 "endTime"  :8*60+50, // 8:50a
                 "days"     :[0,2,4], // M, W, F
                 "enrolled" :100}, // 100 
                {"timeIsTBA":true,
                 "startTime":9*60, // 9am
                 "endTime"  :9*60+50, // 9:50a
                 "days"     :[0,2,4], // M, W, F
                 "enrolled" :200},      // 200
                {"timeIsTBA":false,
                 "startTime":12*60+30, //  12:30p
                 "endTime"  :13*60+50, // 1:50p
                 "days"     :[1,3],     // Tu, Thu
                 "enrolled" :250},      // 
                 {"timeIsTBA":false,
                 "startTime":13*60,     //1p
                 "endTime"  :14*60+50,  //2:50p
                 "days"     :[3],       //Th
                 "enrolled" :50},       // 50
                ];

				let heatmap_data  = generate_heatmap(courses); //2d array populated with the course info
                /*
                          0   1   2   3   4
                         MON TUE WED THU FRI
                0  8a 143,MATH3D 
                1  9a 143,MATH3D
                2 10a 166,MATH3D,CS101
                3 11a ...
                4 12p
                 .
                 .
                 .
                 { heatmap: [[]] } //heatmap is an array of arrays like above ^
                 */
                let heatmap_dict = heatmap_data //view_dict(heatmap_data);
				// ELS: Not sure what this is so I temporarily added the old render call
                // res.render('timecrunch_interface_with_heatmap_data', heatmap_dict);
				res.render('layout', {title: 'timecrunch', data:heatmap_data});
                return;
            }
			res.render('timecrunch_interface_no_data', no_data);
            return;
        });
    }
];

/* private */
function generate_heatmap(courses)
{

    let hm = new Array(14*6).fill(0).map(() => new Array(5).fill(0));
    for (let course of courses) {
        //hm[ROW IS DETERMINED BY TIME][COL IS DETERMINED BY DAY] += course.enrolled
        //maybe like:
        if (course.timeIsTBA) {
            continue;
        }

        let rows = getRows(course.startTime, course.endTime);
        let cols = course.days;
        console.log("Rows, cols", rows, cols);
        for (let row of rows) {
            for (let col of cols) {
                hm[row][col] += course.enrolled;
            }
        }
    }
    return hm;
}

function getRows(startMinutes, endMinutes)
{
    // ASSUMPTION: The table starts at 8am and goes by 10 minute increments
    // TBD: Something about earlier/later times here
    // Move startMinutes and endMinutes to start at 8am
    startMinutes -= 8*60;
    endMinutes   -= 8*60;
    if (startMinutes < 0 || endMinutes < 0) { // YIKES
        console.log("Something badly wrong: class before 8AM");
        return []; // safe failure mode, kind of
    }
    /* Downsample from minutes to 10-minute increments with conservative rounding.
    This means if you have a startTime 12:09 it will map to 12:00
    an endTime 12:01 will map to 12:10
    and a time length from 12:09 to 1:01 will be 70 minutes (12:00 - 1:10).*/
    let start = Math.floor(startMinutes/10);
    let length = Math.ceil((endMinutes/10)-start);
    
    rows = Array(length).fill().map((_, i) => i+start);
    //console.log("For start and end:", startMinutes, endMinutes);
    //console.log("Rows:", rows);
    return rows;
}
