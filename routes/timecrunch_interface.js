const express = require('express');
const router = express.Router();
const interface_controller = require('../controllers/interfaceController'); // form submission script, other complex functions required by interface

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('/timecrunch');
});

router.post('/', interface_controller.exec_query);
module.exports = router;
