var express = require('express');
var router = express.Router();

/* GET timecronch app  */

router.get('/', function(req, res, next) {
  res.render('crunch_interface', {title: 'timecrunch'})
  //res.send('timecromchh pepega: hello worldjk');
});

//  Display interface on GET.
exports.course_create_get = function(req, res, next) {
  res.render('crunch_interface', {title: 'timecrunch'})
};

module.exports = router;
