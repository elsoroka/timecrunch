const express = require('express');
const router = express.Router();
const interface_controller = require('../controllers/interface-controller'); // form submission script, other complex functions required by interface

//TODO: move these render_X functions to controllers/
let render_init = function(req, res, next) {
    next();
};

let render_final = function(req, res, next) {
    let max_time = 14*6; //14 hours in 10 minute increments
    let incrementLabels = []//new Array(max_time).fill('    ');
    let noon = 24; //  4*2*3 = 4 hours in 30 minute chunks
    let mins = ':00'

    for (let i = 0, hours = 8; i < max_time; i += 6) {
        let ampm = i < noon ? 'a': 'p';
        if (i && i % 6 == 0)
            hours = (hours % 12) + 1;

        //mins = i % 2 == 0 ? ':00' : ':30';
        incrementLabels.push(hours + mins + ampm);
    }
    
    let empty_heatmap = [...Array(max_time)].map(() => Array(5).fill(0));
    console.log(JSON.stringify(empty_heatmap));

    let data_object = {
        init: "init",
        weekdayNames_cus: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeIncrements: incrementLabels,
        heatmap: empty_heatmap
    };
    console.log(`heatmap:= ${data_object.heatmap}`);
    console.log(`data_object = ${data_object}`);
	res.render('layout', {title: 'timecrunch', server_data: data_object});
};

/* GET home page. */
router.get('/', [render_init, render_final]);

router.post('/', interface_controller.exec_query);
module.exports = router;
