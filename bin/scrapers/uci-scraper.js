// UCI scraper class

const WebSocApi = require('websoc-api');
const fs = require("fs");
const path = require("path");

function departments() {
	let uciDepts = fs.readFileSync(path.resolve(__dirname, "uci-depts.txt"), "utf-8").split('\n');
	return uciDepts;
}

function levels() {
	return ["Lower Div", "Upper Div", "Graduate"];
}

function name() {
	return "UC Irvine";
}

function currentTerm() {
	return "2020 Winter";
}

function getPromise(options) {
    return WebSocApi.callWebSocAPI(options);
}

function process(result) {
    for (const key of Object.keys(result)) {        
        result[key].map( function(course,i) {
            result[key][i].sections = parseSections(course.sections);
        });
    }
    return result; // fix
}

async function run(options) {
        let result = getPromise(options);
        result = await result.then((json) => {
            final_res = { };

            json["schools"].forEach(school => {
                school["departments"].forEach(department => {
                    courses = [];
                    department["courses"].forEach(course => {
                        var sections = [];
                        course["sections"].forEach(section => {
                            tmp_section = section["meetings"];
                            tmp_section["enrolled"] = section["numCurrentlyEnrolled"]["sectionEnrolled"] == "" ? section["numCurrentlyEnrolled"]["totalEnrolled"] : section["numCurrentlyEnrolled"]["sectionEnrolled"];
                            let res = {"enrolled" : section["numCurrentlyEnrolled"]["sectionEnrolled"] == "" ? section["numCurrentlyEnrolled"]["totalEnrolled"] : section["numCurrentlyEnrolled"]["sectionEnrolled"],
                            "meetings" : section["meetings"]}
                            sections.push(res);
                        });

                        let res = {
                            "courseNumber": course["courseNumber"],
                            "courseTitle": course["courseTitle"],
                            "sections": sections
                        };
                        courses.push(res);
                    });
                    if (final_res[department["deptCode"]]) {
                        final_res[department["deptCode"]].push(...courses);
                    } else {
                        final_res[department["deptCode"]] = courses;
                    }
                });
            });
            return final_res;
        });
        return process(result);
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