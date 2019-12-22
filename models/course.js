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
    const parse_hr_min = (hr_min_str) => hr_min_str.split(':').map(t => parseInt(t,10));
    const calculate_mins_mod12 = (h, m) => (h % 12) * 60 + m;
    const time_in_minutes = (s, ampm, tag) => {
        const [hr,min] = parse_hr_min(s) // input: "XX:XX" output: XX, XX as integers
        let mins_before_noon = 0
        if (ampm == 'p') // if pm, the end hour always is after 12pm, but the start hour needs to checked explicitly
            if (tag == "end" || tag == "start" && hr <= 8 )
                mins_before_noon = 12*60; // greedy: we know this many mins are guaranteed
        return mins_before_noon + calculate_mins_mod12(hr, min); // add the rest
    };
    const [start,end] = unformatted_time.trim().split('-');
    const ampm = end.includes('p') ? 'p' : 'a'; 
    let startMins = time_in_minutes(start, ampm, "start");
    let endMins = time_in_minutes(end, ampm, "end");
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
    let parsed_sections = new Array(sections.length)
    let parsed_section, parsed_meeting
    // create parsed sections
    sections.forEach(section => {
        parsed_section = {}
        console.log(section);
        parsed_section.enrolled = section.enrolled;
        parsed_section.meetings = [];
        section.meetings.forEach(meeting => {
            parsed_meeting = {}
            console.log(meeting)
            parsed_meeting.bldg = meeting.bldg
            if (meeting.time == 'TBA' || meeting.days == '') {
                parsed_meeting.timeIsTBA = true
                parsed_meeting.startTime = 0
                parsed_meeting.endTime = 0
                parsed_meeting.days = [0]
            }
            else {
                let [startMins, endMins] = minutesSinceMidnight(meeting.time)
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
