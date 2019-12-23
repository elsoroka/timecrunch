const express = require('express');
const router = express.Router();
const interface_controller = require('../controllers/interfaceController'); // form submission script, other complex functions required by interface

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log("timecrunch_interface.js");
	res.render('layout', {title: 'timecrunch', data:undefined});

});

router.post('/', interface_controller.exec_query);
module.exports = router;
