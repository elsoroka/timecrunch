// HTML web scraper for explorecourses.stanford.edu

const axios = require('axios');
const cheerio = require('cheerio');
testParser();

// Example URL
// https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on
//const url = "https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on"
// Small testcase URL, 3 results

const url = "https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&page=0&catalog=&academicYear=&q=CS229&collapse=%2C6%2C7%2C"
axios.get(url).then(response => {
	//console.log(response);
	getData(response.data);
})
.catch(error => {
	console.log(error);
});


let getData = html => {
	data = [];
	const $ = cheerio.load(html);
	courses = [];
	$('.searchResult').each(function(i, course) {
		const courseInfo = $(".courseInfo", course);
		const courseNumber = $(".courseNumber", courseInfo).text();
		const courseTitle = $(".courseTitle", courseInfo).text();
		// Retrieve schedule data for one term
		// If there is more than one section, there is more than one li sectionDetails.
		let sections = [];
		$('.sectionDetails', course).each(function(i, meeting) {
			//console.log("\nRaw source\n", $(this).text());
			const location = $('a', this).text();
			console.log("Location", location);
			let section = parseDescriptionString($(this).text());
			if (null != section) {
				// Fix the building listed in meetings
				section.meetings.map( (meeting, _) => meeting.bldg = location );
				sections.push(section);
			}
		});
		// Something went wrong
		if ([] == sections) {
			console.log("WARNING: No valid sections found. Skipping:", courseTitle);
		}
		else {
			console.log(courseNumber, courseTitle);
			sections.map( function(section, _) {
				console.log("Enrolled:", section.enrolled);
				section.meetings.map( function(meeting, _) {
					console.log("\t MEETING", meeting); });
			});
			courses.push({
				division:"Graduate",
				department:"AA",
				courseNumber:courseNumber,
				courseTitle:courseTitle,
				sections:sections,
			});
		}
	});
	return courses;
}


/* PARSING CODE ONLY BEYOND THIS POINT
*/

/* Handles a string like
CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 |
Grading: Letter or Credit/No Credit | LEC | Students enrolled: 23
09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115
*/
function parseDescriptionString(descriptionString) {
	// Split by "|"
	substrings = descriptionString.split('|').map((item, _) =>
		item.trim()); // Remove stray whitespace
	/* Assumption:
	 * The first substring is course name
	 * We already know the name and don't care about the count.
	 * The class #, section #, and grading option must appear (3 more substrings)
	 * Other sections such as unit count UG Reqs may be interspersed, but this is not guaranteed.
	 * We can safely skip at least 4 substrings and scan for the course type (LEC, DIS, LAB...)
	 */
	let index = 4;
	// Find the course type; it should be the first 3 characters
	let courseType = "";
	do {
		courseType = getCourseType(substrings[index].slice(0,3));
		index += 1;
		// If we go out of bounds, this may be a failure
		if (substrings.length < index) {
			console.log("Parser FAILED! Couldn't find course type in:", substrings);
			return null;
		}
	} while ("" == courseType);
	// In some cases, the course type and description are not separated by |
	// This means the course type is the last substring.
	// Fix this by splitting it, assuming all course types are 3 characters long.
	if ((substrings.length == index) && (3 < substrings[index-1].length)) {
		substrings.push(substrings[index-1].slice(3).trim());
		// console.log("Fixed un-split courseType and description", substrings);
	}

	/* Assumption:
	 * The section directly after course type contains the scheduling information.
	 */
	// Retrieve the enrollment count
	let dataString = substrings[index];
	let enrolled=0;
	// Retrieve the enrolled count, which may be 0 but cannot be null or undefined.
	[enrolled, _, newIndex] = getMatch(dataString, /Students\senrolled:\s(\d+)\s(\/ \d+)?/, 0);
	
	dataString = dataString.slice(newIndex);

	// Retrieve multiple meetings from the remainder of the string.
	let meetings = [];
	let meeting = null;
	do {
		[meeting, dataString] = parseScheduleString(dataString);
		if (null != meeting) {
			meetings.push(meeting);
		}
	} while (meeting != null);
	// console.log("Enrolled", enrolled, "Meetings", meetings);
	// Something may be wrong, we didn't find any meetings at all.
	if ([] == meetings) {
		console.log("\nWARNING: No schedule found in:", descriptionString);
	}

	// Return the sections (remember we haven't got the location in the meetings yet)
	return {
		enrolled:enrolled,
		meetings:meetings,
	}
}

/* Operates on the schedule portion of the string, which looks like:
 * 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115
 */
function parseScheduleString(dataString) {
	// Declaring some variables...
	let startTime=0, endTime=0;
	let startEndDate="";
	
	// Retrieve the quarter start/end date
	[startEndDate, _, newIndex] = getMatch(dataString, /(\d\d\/\d\d\/\d{4}\s-\s\d\d\/\d\d\/\d{4})/, "");
	dataString = dataString.slice(newIndex);

	/* We want to find the times first. This is to determine where the days are
	* because the string may contain another schedule listing
	* Example:
	* "09/23/2019 - 12/06/2019 Mon, Wed 1:30 PM - 2:50 PM at...
	* 09/23/2019 - 12/06/2019 Fri 1:30 PM - 3:50 PM at..." (THIS IS ONE STRING).
	* In this case, we want to return the FIRST listing and the remainder of the string.
	* So the return data is Mon, Wed 1:30 PM - 2:50 PM.
	*/
	// Retrieve the startTime
	[startTime, matchIndex, newIndex] = getMatch(dataString, /((\d{1,2}:\d{1,2})\s(A|P)M)/, null);
	
	// Save a piece of the string before the times, assuming it contains the days
	const dayString = dataString.slice(0, matchIndex);
	// Cut off the days and the startTime
	dataString = dataString.slice(newIndex);

	// Retrieve the endTime
	[endTime, newIndex] = getMatch(dataString, /((\d{1,2}:\d{1,2})\s(A|P)M)/, null);
	dataString = dataString.slice(newIndex);

	// Convert times from string to minutes past 00:00.
	startTime = parseTime(startTime);
	endTime   = parseTime(endTime);

	// Find the days in the piece we saved (returns [] if none found)
	days = parseDays(dayString);

	// Couldn't find times/days, this is OK because it happens at the end of the string.
	if ((null == startTime) || (null == endTime) || (0 == days.length)) {
		return [null, dataString]
	}

	/* It is not possible to positively identify a TBA class
	* because they do not appear to follow a standard format.
	* TBA will always be false if a valid listing is found.
	* No TBA / unscheduled classes shall appear in the scraped data.
	*/
	// This is almost a complete meeting object but the bldg is missing.
	return [{startTime : startTime,
			 endTime   : endTime,
			 days      : days,
			 timeIsTBA : false,
			 bldg      : null}, dataString];
}

// Turns out we don't really need these.
/*
function getClassNum(classNumStr) {
	if (classNumStr.startsWith("Class #")) {
		return classNumStr.slice(7).trim();
	}
	else {
		return "";
	}
}

function getSection(sectionStr) {
	if (sectionStr.startsWith("Section")) {
		return sectionStr.slice(7).trim();
	}
	else {
		return "";
	}
	*/

function getCourseType(courseTypeStr) {
	const courseTypes = ["LEC", "SEM", "DIS", "LAB", "LBS", "ACT",
	"CAS", "COL", "WKS", "INS", "IDS", "ISF", "ISS", "ITR", "API",
	"LNG", "CLK", "PRA", "PRC", "RES", "SCS", "T/D"];
	if (courseTypes.includes(courseTypeStr)) {
		return courseTypeStr;
	}
	else {
		return "";
	}
}

/* Generic function to match a pattern in a string or return a specified value.
 * Returns an array [firstMatchGroup, startIndexOfMatch, endIndexOfMatch]
 * This is used to find the days, times, quarter start/end, etc.
 * endIndexOfMatch points to the new start of the string, after the match we just found.
 */

function getMatch(textStr, pattern, returnOnNoMatch) {
	const result = textStr.match(pattern);
	if (null != result) {
		const firstGroup = result[1];
		const newIndex = result.index + result[0].length;
		return [firstGroup, result.index, newIndex];
	}
	else {
		return [returnOnNoMatch, 0, 0];
	}
}

/* Retrieve days from a string: "Mon, Wed, Fri" returns [0,2,4]
 * "Tue, Thu" returns [1,3]
 * Questionable: "Wed, Tue, Mon" returns [2,1,0] (should we sort the output?)
 * This function finds ALL the days in the string.
 */
function parseDays(dataString) {
	let result = null, days = [];
	do {
		// Map days of week to indices
		const dayMap = {"Mon":0, "Tue":1, "Wed":2, "Thu":3, "Fri":4, "Sat":5, "Sun":6};

		[result, _, newIndex] = getMatch(dataString, /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/, null);
		dataString = dataString.slice(newIndex);
		if (null != result) {
			days.push(dayMap[result]);
		}
	} while (null != result);
	return days;
}

// Given a string like "11:30 AM" or "12:00PM", return the time as minutes since 00:00
// "It is not recommended to use Date.parse" ~Mozilla
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
function parseTime(timeString) {
	// It is possible to get a null here
	if (null == timeString) {
		return null;
	}
	// The first group is the hours, the second is minutes, the third is A or P
	result = timeString.match(/(\d{1,2}):(\d{2})\s?(A|P)M/);
	if ((null != result) && (4 == result.length)) {
		return parseInt(result[1])*60 + parseInt(result[2]) + (("P" === result[3]) ? 12*60 : 0);
	}
	else {
		return null; // Failed to find it
	}
}

function testParser() {
	testInputs = [
		"CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 | Grading: Letter or Credit/No Credit | LEC | \
		Students enrolled: 23 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115",
		"AA 200 | 3 units | Class # 8010 | Section 01 | Grading: Letter (ABCD/NP) | LEC | Students enrolled: 68 / 90 \
		01/06/2020 - 03/13/2020 Tue, Thu 4:30 PM - 5:50 PM at Gates B3 with ...\
		Instructors: Alonso, J. (PI)",
		"AA 229 | 3-4 units | Class # 19492 | Section 01 | Grading: Letter or Credit/No Credit | LEC | \
		Students enrolled: 15 01/06/2020 - 03/13/2020 Mon, Wed 1:30 PM - 2:50 PM at McMurtry Building 102, Oshman with ...",
		// A test case with an exam date listing
		"CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 | Grading: Letter or Credit/No Credit | LEC | Students enrolled: 23 \
		09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115 with ...\
		Exam Date/Time: 2019-12-11 3:30pm - 6:30pm (Exam Schedule)",
		// A test case with multiple meetings
		"CEE 322 | 3 units | Class # 7893 | Section 01 | Grading: Letter or Credit/No Credit | LEC |\
		Students enrolled: 25 \
		09/23/2019 - 12/06/2019 Mon, Wed 1:30 PM - 2:50 PM at 380-380W with ... (PI)\
		09/23/2019 - 12/06/2019 Fri 9:30 AM - 10:50 AM at McCullough 126 with ... (PI)",
		"CS 229 | 3-4 units | Class # 7879 | Section 01 | Grading: Letter or Credit/No Credit | LEC |\
		Students enrolled: 375 \
		09/23/2019 - 12/06/2019 Mon, Wed 9:30 AM - 10:50 AM at NVIDIA Auditorium with ... (PI);",
];
	testInputs.map( (testInput, _) => parseDescriptionString(testInput) );
}