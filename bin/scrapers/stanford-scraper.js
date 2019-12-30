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
		index += 1;
	}
	
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
	let dataString = substrings[index];
	
	// Declaring some variables...
	let enrolled=0, startTime=0, endTime=0
	let startEndDate="";
	
	// Retrieve the enrolled count, which may be 0 but will not be null or undefined.
	[enrolled, newIndex] = getMatch(dataString, /Students enrolled: (\d+) (\/ \d+)?/, 0);
	dataString = dataString.slice(newIndex);
	console.log("RESULT", enrolled, "\nremaining", dataString);
	
	// Retrieve the quarter start/end date
	[startEndDate, newIndex] = getMatch(dataString, /(\d\d\/\d\d\/\d{4} - \d\d\/\d\d\/\d{4})/, "");
	dataString = dataString.slice(newIndex);
	console.log("RESULT", startEndDate, "\nremaining", dataString);

	// Retrieve the days
	let result = null, days = [];
	do {
		[result, newIndex] = getMatch(dataString, /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/, null);
		dataString = dataString.slice(newIndex);
		console.log("RESULT", result, "\nremaining", dataString);
		
		if (null != result) {
			days.push(result);
		}
	} while (null != result);

	console.log("RESULT", days, "\nremaining", dataString);
}


function getClassNum(classNumStr) {
	if (classNumStr.startsWith("Class #")) {
		return classNumStr.slice(7, -1).trim();
	}
	else {
		return "";
	}
}

function getSection(sectionStr) {
	if (sectionStr.startsWith("Section")) {
		return sectionStr.slice(7, -1).trim();
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
		return [firstGroup, newIndex];
	}
	else {
		console.log("Didn't find match");
		return [returnOnNoMatch, 0];
	}
}

function testParser() {
	testInput1 = "CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 | Grading: Letter or Credit/No Credit | LEC | Students enrolled: 23 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115";
	parseDescriptionString(testInput1);
}