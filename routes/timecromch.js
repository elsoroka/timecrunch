var express = require('express');
var router = express.Router();

/* GET timecronch app  */

router.get('/', function(req, res, next) {
  res.render('layout', {title: 'timecrunch', data:undefined})
  //res.send('timecromchh pepega: hello worldjk');
});

/* POST to handle the submit button ~ELS */
router.post('/', function(req, res, next) {
	console.log("POST request with body:")
	console.log(req.body)
	// Put the DB query here
	// Maybe the DB query function should return the 2D array representing the heatmap
	// 14 hours * 6 10-minute increments = 14*6 rows
	const heatmap = new Array(14*6).fill(0).map(() => new Array(5).fill(0));

	// Fill with some fake data
	for (let i=0; i<heatmap.length; ++i) {
		for (let j=0; j<heatmap[i].length; ++j) {
			heatmap[i][j] = Math.floor((Math.random() * 100) + 1); // Random fake data, 0 - 100
		}
	}
	res.render('layout', {title:'timecrunch', data:heatmap})
})

//  Display interface on GET.
exports.course_create_get = function(req, res, next) {
  res.render('layout', {title: 'timecrunch', data:undefined})
};

module.exports = router;
