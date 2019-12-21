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
				res.render('timecrunch_interface_with_heatmap_data', heatmap_dict);
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

	const heatmap = new Array(14*6).fill(0).map(() => new Array(5).fill(0));
    for (course in courses)
    {
        // TODO: use info to accumulate 2D histogram packaged in JSON so we can pass the object to pug 
        // accumulate_heatmap(course_doc, hmap);
    }
    return heatmap;
}
