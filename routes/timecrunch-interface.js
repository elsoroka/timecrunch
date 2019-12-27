const express = require('express');
const router = express.Router();
const interfaceController = require('../controllers/interface-controller'); // form submission script, other complex functions required by interface

/* GET initial page state */
router.get('/', interfaceController.initializePage);
//router.get('/initializeHeatmap', interfaceController.renderEmptyHeatmap); // perceptually faster loading to send the empty heatmap directly

/* GET to set school */
router.get('/setSchool', interfaceController.setSchool);

/* POST user query */
router.post('/', interfaceController.renderHeatmap);
module.exports = router;
