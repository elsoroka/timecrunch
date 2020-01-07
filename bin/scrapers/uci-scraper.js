// UCI scraper class

const WebSocApi = require('websoc-api');
const fs = require("fs");
const path = require("path");

function departments() {
	let uciDepts = fs.readFileSync(path.resolve(__dirname, "uci-depts.txt"), "utf-8").split('\n');
	return uciDepts;
}

function levels() {
	return ["LowerDiv", "UpperDiv", "Graduate"];
}

function name() {
	return "UC Irvine";
}

// lower-case, no spaces special characters
// this can be used to form a filename, for example	
// -max
function formattedName() {
	return "uci";
}

function currentTerm() {
	return "2020 Winter";
}

function process(courses, options) {
    // Add the course level because we don't know it from the result
    // we just have it from options
    const courseLevel = options["division"];
    courses.forEach(course => {
        course = parseSections(course.sections);
    });
    return courses; // fix
}

function scrapeCourse(course, courses) {
    let sections = [];
    course["sections"].forEach(section => {
        scrapeSection(section, sections);
    });// side-effect: "sections" array is full
    courses.push({
        "courseNumber": course["courseNumber"],
        "courseTitle": course["courseTitle"],
        "sections": sections,
        "university": name(),
        "department":department["deptCode"],
    });
}


function scrapeSection(section, sections) {
    sections.push({
    "enrolled" : section["numCurrentlyEnrolled"]["sectionEnrolled"] == "" 
        ? section["numCurrentlyEnrolled"]["totalEnrolled"] 
        : section["numCurrentlyEnrolled"]["sectionEnrolled"],
    "meetings" : section["meetings"]
    });
}

async function run(options) {
        // Get a Promise
        let result = WebSocApi.callWebSocAPI(options);
        // Resolve the Promise
        result = await result.then((json) => {

            //final_res = { };
            // TODO: I question this structure. options specifies ONE department
            // and ONE level. So I think some of this nesting can be flattened.
            // ~Emi
            // for now, run is supposed to return a LIST of courses matching options
            courses = [];
            json["schools"].forEach(school => {
                school["departments"].forEach(department => {
                    department["courses"].forEach(course => {
                        scrapeCourse(course, courses);
                    });
                    /*if (final_res[department["deptCode"]]) {
                        final_res[department["deptCode"]].push(...courses);
                    } else {
                        final_res[department["deptCode"]] = courses;
                    }*/
                });
            });
            // TODO: At this point we don't have the course division
            return courses;
        });
        return process(result, options);
}

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

function convertDaysToIntArray(days_string) {
    //  Saturday and Sunday may need to be changed, havent seen the actual values to look for
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

// Called by process()
function parseSections(sections) {
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
                parsed_meeting.days = []
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

module.exports = {departments, levels, name, currentTerm, run, process}
