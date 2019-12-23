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
		        defaultTimeStop=22*60,
		        defaultDays=5,
		        timeFormat='12',
		        ) {
		// Data integrity checks
		// timeStep must be a positive integer and divide evenly into 60 minutes (1 hour)
		assert(timeStep > 0 && Number.isInteger(60/timeStep));
		// defaultTimeStart and defaultTimeStop must be hour values (multiples of 60min)
		assert(Number.isInteger(defaultTimeStart/60) && Number.isInteger(defaultTimeStop/60));
		// time must start before it stops
		assert(defaultTimeStart < defaultTimeStop);
		// For UI testability reasons, restrict to 5 weekdays + 2 optional weekend days
		assert(defaultDays >= 5 && defaultDays <= 7);
		// Are there other time formats? Rewrite when humanity reaches Mars.
		assert(timeFormat == '12' || timeFormat == '24');

		// Data integrity checks complete.
		this.timeStep   = timeStep;
		this.timeStart  = defaultTimeStart;
		this.timeStop   = defaultTimeStop;
		this.days       = defaultDays;
		this.timeFormat = timeFormat;
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
	    // If startMinutes is EARLIER than the first row, prepend row(s) to display it.
	    if (startMinutes < this.timeStart) {
	    	// Guarantee timeStart is a whole hour value
	    	// Otherwise, it will be difficult to guarantee rows are labeled correctly.
	    	const hoursToAdd = Math.ceil((this.timeStart - startMinutes)/60);
	    	// Because we have guaranteed 60/this.timeStep is integer, this is safe.
	    	const newRows = new Array(hoursToAdd*60/this.timeStep).fill(0).map( () => new Array(this.days).fill(0));
	    	
	    	this.heatmap.unshift(...newRows);
	    	// Fix the starting time
	    	this.timeStart -= newRows.length*this.timeStep;
	    	// console.log("Added rows", newRows, "timeStart", this.timeStart);
	    }
	    // If endMinutes is LATER than the last row, append row(s) to display it.
	    if (endMinutes > this.timeStop) {
	    	const hoursToAdd = Math.ceil((endMinutes - this.timeStop)/60);
	    	const newRows = new Array(hoursToAdd*60/this.timeStep).fill(0).map( () => new Array(this.days).fill(0));
	    	this.heatmap.push(...newRows);
	    	// Fix te ending time
	    	this.timeStop += newRows.length*this.timeStep;
	    	// console.log("Added rows", newRows, "timeEnd", this.timeStop);
	    }
	    
	    /* Downsample from minutes to timeStep increments with "greedy" rounding.
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

	// Return a list of all the time indices
	getTimeLabels() {

	}

	// Return a list of the days
	getDayLabels() {
		alldays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
		return alldays.slice(0,this.days);
	}
}

module.exports = GenericHeatmap