var express = require('express');
var router = express.Router();

/* GET timecronch app  */

router.get('/', function(req, res, next) {
  res.render('crunch_interface', {title: 'timecrunch'})
  //res.send('timecromchh pepega: hello worldjk');
});

/* POST to handle the submit button ~ELS */
router.post('/', function(req, res, next) {
	console.log("POST request with body:")
	console.log(req.body)
	// Put the DB query here
	for (const dept_name of req.body.dept_names) {
		// Do some THING
		console.log(dept_name)
	}
	res.render('crunch_interface', {title: 'timecrunch'})
})

//  Display interface on GET.
exports.course_create_get = function(req, res, next) {
  res.render('crunch_interface', {title: 'timecrunch'})
};

module.exports = router;
