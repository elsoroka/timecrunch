// HTML web scraper for explorecourses.stanford.edu

const axios = require('axios');
const cheerio = require('cheerio');

// Example URL
// https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on
testParser();
/*const url = "https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on"

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
		const sections = [];
		// If there is more than one section, there is more than one li sectionDetails.
		const sections = $('.sectionDetails', course).each(function(i, meeting) {
			console.log("MEETING", $(this).text());
			const location = $('a', this).text();
			sections.push({
				enrolled:0,
				meetings:[{
					bldg:location,
					timeIsTBA:false,
					
				}]
			});
		});
		courses.push({
			division:"Graduate",
			department:"AA",
			courseNumber:courseNumber,
			courseTitle:courseTitle,
			sections:sections,
		});
	});
}*/

/* Handles a string like
CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 |
Grading: Letter or Credit/No Credit | LEC | Students enrolled: 23
09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115
*/
function parseDescriptionString(descriptionString) {
	// Split by |
	substrings = descriptionString.split('|').map((item, _) =>
		item.trim()); // Remove stray whitespace
	console.log("rimmed:", substrings);

	// Assumption: At least 7 items in string
	if (7 > substrings.length) {
		// Bad news
		console.log("Parser FAILED! Not enough substrings: found ",
					substrings.length, "in", descriptionString);
		return;
	}
	// Skip the first 2 items, class name and unit count
	let index = 2;

	// The next is either class number or UG Reqs which we don't want
	let classNum = getClassNum(substrings[index]);
	if ("" == classNum) {
		index += 1; // Skip it
		classNum = getClassNum(substrings[index]);
		if ("" == classNum) {
			console.log("Parser FAILED! Couldn't find class number. Found:", substrings[0]);
			return;
		}
	}
	index += 1;
	
	// If we got here, we have the class number and the next item is section number
	let sectionNum = getSection(substrings[index]);
	if ("" == sectionNum) {
		console.log("Parser FAILED! Couldn't find section number. Found:", substrings[index]);
		return;
	}
	index += 1;
	
	// If we got here, skip the grading section
	index += 1;

	// Now we have the course type
	let courseType = getCourseType(substrings[index]);
	if ("" == courseType) {
		console.log("Parser FAILED! Couldn't find course type. Found:", substrings[index]);
		return;
	}
	index += 1;

	// The next bit is the important one with the dates/times/enrollment count
	console.log("classNum, sectionNum, courseType:", classNum, sectionNum, courseType);
	console.log("The last bit is:", substrings[index]);
	
	// Retrieve the enrollment count
	let dataString = substrings[index];
	let enrolled=0;
	// Retrieve the enrolled count, which may be 0 but cannot be null or undefined.
	[enrolled, _, newIndex] = getMatch(dataString, /Students enrolled: (\d+) (\/ \d+)?/, 0);
	dataString = dataString.slice(newIndex);
	console.log("RESULT", enrolled, "\nremaining", dataString);

	meeting = parseScheduleString(dataString);
	console.log("Meeting", meeting);
}

/* Operates on the schedule portion of the string, which looks like:
 * 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115
 */
function parseScheduleString(dataString) {
	// Declaring some variables...
	let startTime=0, endTime=0;
	let startEndDate="";
	
	// Retrieve the quarter start/end date
	[startEndDate, _, newIndex] = getMatch(dataString, /(\d\d\/\d\d\/\d{4} - \d\d\/\d\d\/\d{4})/, "");
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
	console.log("Days only:", dayString);
	// Cut off the days and the startTime
	dataString = dataString.slice(newIndex);

	// Retrieve the endTime
	[endTime, newIndex] = getMatch(dataString, /((\d{1,2}:\d{1,2})\s(A|P)M)/, null);
	dataString = dataString.slice(newIndex);

	// Find the days in the piece we saved (returns [] if none found)
	days = parseDays(dayString);

	// Couldn't find times/days
	if ((null == startTime) || (null == endTime) || (0 == days.length)) {
		console.log("Parser FAILED! Couldn't find time/day in:", dataString);
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
}

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

/* FUNCTIONS which operate on a single string such as
 * "Students enrolled: 23 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115"
 * Each function returns an array [value, newIndex]
 * The value is the value the function was looking for
 * (for example, number of enrolled students)
 * The newIndex is the new start of the string, without the part we just used
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

function testParser() {
	testInputs = [
		"CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 | Grading: Letter or Credit/No Credit | LEC | \
		Students enrolled: 23 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115",
		"AA 200 | 3 units | Class # 8010 | Section 01 | Grading: Letter (ABCD/NP) | LEC | Students enrolled: 68 / 90 \
		01/06/2020 - 03/13/2020 Tue, Thu 4:30 PM - 5:50 PM at Gates B3 with Alonso, J. (PI) \
		Instructors: Alonso, J. (PI)",
		"AA 229 | 3-4 units | Class # 19492 | Section 01 | Grading: Letter or Credit/No Credit | LEC | \
		Students enrolled: 15 01/06/2020 - 03/13/2020 Mon, Wed 1:30 PM - 2:50 PM at McMurtry Building 102, Oshman with Kochenderfer, M. (PI)",
		];
	testInputs.map( (testInput, _) => parseDescriptionString(testInput) );
}