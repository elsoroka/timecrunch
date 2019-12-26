const express = require('express');
const router = express.Router();
const interfaceController = require('../controllers/interface-controller'); // form submission script, other complex functions required by interface

/* GET home page. */
router.get('/', interfaceController.renderEmptyHeatmap);

/* GET to set school */
router.get('/setSchool', interfaceController.setSchool);

/* POST user query */
router.post('/', interfaceController.renderHeatmap);
module.exports = router;
