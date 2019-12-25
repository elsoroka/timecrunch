/* interface controller */
// TODO: extend to handle multiple universities
const Course = require('../models/course')
const GenericHeatmap = require('./generic-heatmap')

// none of these are used right now 
var async = require('async');
const{ body, validationResult } = require('express-validator/check');
const{ sanitizeBody } = require('express-validator/filter');

/*  public controller functions */

// execute user query on POST (user-facing form submission)
exports.exec_query = [
    // Validate that at least one department (or other demographic category) was selected
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
		let demographics = req.body.dept_names;
        let departments = demographics; // assume demographics is an array of departments TODO: allow for specific divisions also
        let union_of_conditions = []

        /*
         * Build OR'd Query
         */
        departments.forEach(dept_name => {
            if (dept_name != '')
                union_of_conditions.push({department: dept_name})
        });
        // TODO: add divisions, but also later want to handle conditions like lower Math + upper CS
        // The latter would look like conditions = [{division: 'lower', department: 'Math'}, {division: 'upper', department: 'CS'}] 
        
        // let divisions = division;
        let for_university = { university: "uci" } // TODO: allow user to choose university

        // Build the query to get all courses 
        let course_query = Course.find(for_university).or(union_of_conditions).orFail();//new Error("No courses found")); 
        // Run the query, exec returns a Promise
        course_query.exec( function(err, courses) {
			if (err) return next(err); // TODO: catch and handle error: "No courses found" 

            if (courses)
            {
                console.log("COURSES:");
                console.log(courses);
                hm = new GenericHeatmap(10); // timestep of 10 minutes
				hm.fill(courses); //2d array populated with the course info
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
                // let heatmap_dict = heatmap_data //view_dict(heatmap_data);
				// ELS: Not sure what this is so I temporarily added the old render call
                // res.render('timecrunch_interface_with_heatmap_data', heatmap_dict);
                console.log("interfaceController:: about to render heatmap");

                  let data_object = {
                        init: "false",
                        weekdayNames_cus: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        timeIncrements: hm.incrementLabels,
                        heatmap: hm.heatmap 
                    };

				res.render('layout', {title: 'timecrunch', server_data: data_object});
                return;
            }
			res.render('timecrunch_interface_no_data', no_data);
            return;
        });
    }
];

/* private */
/* generate_heatmap moved to GenericHeatmap class */
