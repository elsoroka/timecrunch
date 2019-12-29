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

	// The next bit is the important one and god help us.
	console.log("classNum, sectionNum, courseType:", classNum, sectionNum, courseType);
	console.log("The last bit is:", substrings[index]);
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


function testParser() {
	testInput1 = "CEE 107A | 3-5 units | UG Reqs: GER:DB-EngrAppSci, WAY-SI | Class # 7814 | Section 01 | Grading: Letter or Credit/No Credit | LEC | Students enrolled: 23 09/23/2019 - 12/06/2019 Mon, Wed, Fri 1:30 PM - 2:50 PM at McCullough 115";
	parseDescriptionString(testInput1);
}