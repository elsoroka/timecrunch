/* A generic heatmap to future-proof the interface
 * against many use cases and many universities
 * All time is in MINUTES.
 */
const assert = require('assert');

class GenericHeatmap {
	/* Construct a Heatmap with a given time increment
	 * The time increment represents one row in the heatmap.
	 */
	constructor(timeStep,
		        defaultTimeStart=8*60,
		        defaultTimeStop=20*60,
		        defaultDays=5,
		        timeFormat='12',
		        ) {
		// Data integrity checks
		assert(Number.isInteger(timeStep) && timeStep > 0);
		assert(defaultTimeStart < defaultTimeStop);

		// For UI testability reasons, restrict to 5 weekdays + 2 optional weekend days
		assert(defaultDays >= 5 && defaultDays <= 7);
		// 
		assert(timeFormat == '12' || timeFormat == '24');

		// Data integrity checks complete.
		this.timeStep    = timeStep;
		this.timeStart   = defaultTimeStart;
		this.timeStop    = defaultTimeStop;
		this.defaultDays = defaultDays;
		this.timeFormat  = timeFormat;
		// Construct the array with the default start/stop/days
		// If a class is found later which is outside this range,
		// the array size will change.
		const nRows = Math.ceil((defaultTimeStop-defaultTimeStart)/timeStep);
		this.heatmap = new Array(nRows).fill(0).map( () => new Array(defaultDays).fill(0));
	}

	fill(courses) {
		for (const course of courses) {
			if (course.timeIsTBA) {
            	continue;
        	}

        	const rows = this.getRows(course.startTime, course.endTime);
        	const cols = course.days;
        	console.log("Rows", rows, "Cols", cols);
        	for (const row of rows) {
        		console.log("row", row);
	            for (const col of cols) {
	            	console.log("col", col);
                	this.heatmap[row][col] += course.enrolled;
            	}
        	}
		}
	}

	getRows(startMinutes, endMinutes)
	{
	    // ASSUMPTION: The table starts at 8am and goes by 10 minute increments
	    // TBD: Something about earlier/later times here
	    // Move startMinutes and endMinutes to start at 8am
	    
	    /* Downsample from minutes to timeStep increments with conservative rounding.
	    This means if you have a startTime 12:09 it will map to 12:00
	    an endTime 12:01 will map to 12:10
	    and a time length from 12:09 to 1:01 will be 70 minutes (12:00 - 1:10).*/
	    const start  = Math.floor((startMinutes-this.timeStart)/this.timeStep);
	    const end    = Math.ceil((endMinutes-this.timeStart)/this.timeStep);
	    const length = end-start;
	    
	    const rows = Array(length).fill().map((_, i) => i+start);
	    //console.log("For start and end:", startMinutes, endMinutes);
	    //console.log("Rows:", rows);
	    return rows;
	}
}

module.exports = GenericHeatmap