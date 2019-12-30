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
		        defaultTimeStart = 8*60,
		        defaultTimeStop  = 22*60,
		        defaultDays      = 5,
		        timeFormat       = '12',
		        ) {
        // Debug Help
        this.class_id = "GenericHeatmap::";
        let get_id = (s) => this.class_id + s;
        this.constructor_id = get_id("constructor:");
        this.getRows_id = get_id("getRows:");
        this.getFill_id = get_id("getRows:");
        this.dbg = funct_id => {
            return (variable) => {
                let varName = Object.keys(variable)[0];
                let varValue = variable[varName];
                console.log(`${funct_id} ${varName} = ${varValue}`);
            };
        };

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
        console.log(this.constructor_id + "Data integrity checks complete");

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
        console.log(this.constructor_id + "Constructor Finished");

        let max_time = 14*6; //14 hours in 10 minute increments
        this.incrementLabels = [];//new Array(max_time).fill('    ');
        let noon = 24; //  4*2*3 = 4 hours in 30 minute chunks
        let mins = ':00';
        for (let i = 0, hours = 8; i < max_time; i += 6) {
            let ampm = i < noon ? 'a': 'p';
            if (i && i % 6 == 0)
                hours = (hours % 12) + 1;

            //let mins = i % 2 == 0 ? ':00' : ':30';
            this.incrementLabels.push(hours + mins + ampm)
        }
	}

	fill(courses) {
        let dbg = this.dbg(this.getFill_id);
        courses.forEach(course => { 
            dbg({course});
            course.sections.forEach(section => {
                section.meetings.forEach(meeting => { 

                    if (meeting.timeIsTBA) 
                        return; // in a .forEach, this works like continue, i.e. goes to next element
                    const rows = this.getRows(meeting.startTime, meeting.endTime);
                    const cols = this.getCols(meeting.days);
                    //console.log("Rows", rows, "Cols", cols);
                    rows.forEach(row => { 
                        //console.log("row", row);
                        cols.forEach( col => {
                            //console.log("col", col);
                            this.heatmap[row][col] += section.enrolled;
                        }); //end for cols
                    }); // end for rows

                }); //end for meetings
            }); // end for sections
        }); //end for courses
	}

	getRows(startMinutes, endMinutes) {
        let dbg = this.dbg(this.getRows_id);
        dbg({startMinutes});
        dbg({endMinutes});
	    // If startMinutes is EARLIER than the first row, prepend row(s) to display it.
	    if (startMinutes < this.timeStart) {
	    	// Guarantee timeStart is a whole hour value
	    	// Otherwise, it will be difficult to guarantee rows are labeled correctly.
	    	const hoursToAdd = Math.ceil((this.timeStart - startMinutes)/60);
	    	// Because we have guaranteed 60/this.timeStep is integer, this is safe.
            //console.log(`${this.getRows_id} hoursToAdd = ${hoursToAdd}`);
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
        dbg({end});
        dbg({start});
        dbg({length});
	    
	    const rows = new Array(length).fill().map((_, i) => i+start );
	    //console.log("For start and end:", startMinutes, endMinutes);
	    //console.log("Rows:", rows);
	    return rows;
	}

	getCols(days) {
		// this.days = number of columns we have allocated
		// If we have a day outside this.days we need to add column(s).
		const extras = days.filter( (day, _) => (day >= this.days));
		// Add if necessary
		if (0 != extras.length) {
			const newDays = new Array(extras.length).fill(0);
			for (let row of this.heatmap) {
				row.push(...newDays);
			}
			// Update this.days limit
			this.days += extras.length;
			console.log("Added!!", this.heatmap);
		}
		return days;
	}

	// Return a list of all the time indices
	getTimeLabels() {
		// this.timeStart and this.timeStop are guaranteed to be integer multiples of 60.
		const startHour = this.timeStart/60;
		// Hour and half-hour labels
		let times = Array(2*(this.timeStop/60-startHour));
		// This function generates labels of the form 8:00, 8:30, 9:00, 9:30...
		times.fill().map( (_, i) => Math.floor(startHour+i/2) + (i%2 ? ':30' : ':00'));
	}

	// Return a list of the days
	getDayLabels() {
		const alldays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
		return alldays.slice(0,this.days); 
	}

    /*
     * This is the initially empty heatmap served to the client before 
     * the user has posted a query.
     * TODO: take another look with the instance methods to see is this
     * they can re-use some of this code.
     */
    static emptyHeatmapJson() {
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

        let heatmap_data = {
            init: "init",
            weekdayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            timeIncrements: incrementLabels,
            heatmap: empty_heatmap
        };
        return heatmap_data;
    }
}

module.exports = GenericHeatmap
