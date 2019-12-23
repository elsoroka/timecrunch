const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
{
    university: String,
    division: String,  
    department: String,
    // The names of the fields follow what WebSoc and websoc-api calls these
	courseNumber: String, // e.g. "20A"
	courseTitle: String,
	// array of sections with nested array of parsed meetings
	sections: 
    [{
        enrolled: Number,       // enrolled under this department
        meetings: 
        [{
            bldg: String,
            timeIsTBA: Boolean, // if true, then times are not valid
            startTime: Number,  // minutes since 12am
            endTime: Number,    // minutes since 12am
            days: [Number]
        }]
    }]
}, {timestamps:{}}); // option timestamps automatically adds createdAt and updatedAt fields


//' XX:XX- XX:XXp' to [startMins, endMins] starting from midnight
function minutesSinceMidnight(unformatted_time) {

	// input: "XX:XX" output: XX, XX as integers
    const parse_hr_min = (hr_min_str) => hr_min_str.split(':').map(t => parseInt(t,10));
    const calculate_mins_mod12 = (h, m) => (h % 12) * 60 + m;
    const [start,end] = unformatted_time.trim().split('-');
	const [sh, sm] = parse_hr_min(start);
	const [eh, em] =  parse_hr_min(end);
	const noon = 720; // 12*6
	let startMins, endMins
    if(end.includes('p')){ // pm
		// assume both pm 
		endMins = noon + calculate_mins_mod12(eh, em);
		startMins = noon + calculate_mins_mod12(sh, sm);
		// fix assumption if breaks constraint
		if (startMins >= endMins) 
			startMins = calculate_mins_mod12(sh, sm);
	}
	else { // am
		endMins = calculate_mins_mod12(eh, em);
		startMins = calculate_mins_mod12(sh, sm);
	}

	// final validation
	if (startMins >= endMins) {
		console.log('Error parsing minutes: startMins >= endMins')
		return []
	}
    return [startMins, endMins]
};

// TODO: validate this in case some university uses a daystring with unexpected chars
function convertDaysToIntArray(days_string) {
    const days_re = /[MWF]|Tu|Th|Sa|Su/g;
    const dayDict = {"M": 0, "Tu": 1, "W": 2, "Th": 3, "F": 4, "Sa": 5, "Su": 6}
    let dayInts = [] 
    let match;
    do {
        match = days_re.exec(days_string);
        if (match) {
            //console.log(match)
            dayInts.push(dayDict[match[0]]);
        }
    } while(match);
    return dayInts
}

CourseSchema.statics.parseSections = function(sections) {
    let parsed_sections = []
    let parsed_section, parsed_meeting
    // create parsed sections
    sections.forEach(section => {
        parsed_section = {}
        //console.log(section);
        parsed_section.enrolled = section.enrolled;
        parsed_section.meetings = [];
        section.meetings.forEach(meeting => {
            parsed_meeting = {}
            //console.log(meeting)
            parsed_meeting.bldg = meeting.bldg
            if (meeting.time == 'TBA' || meeting.days == '') {
                parsed_meeting.timeIsTBA = true
                parsed_meeting.startTime = 0
                parsed_meeting.endTime = 0
                parsed_meeting.days = [0]
            }
            else {
				let isValid = minutesSinceMidnight(meeting.time);
				if (isValid.length == 0)
					return null;
                let [startMins, endMins] = isValid
                parsed_meeting.startTime = startMins
                parsed_meeting.endTime = endMins
                parsed_meeting.days = convertDaysToIntArray(meeting.days)
                parsed_meeting.timeIsTBA = false
            }
            parsed_section.meetings.push(parsed_meeting);
        });
        parsed_sections.push(parsed_section);
    });
    return parsed_sections;
};

module.exports = mongoose.model('Course', CourseSchema);
