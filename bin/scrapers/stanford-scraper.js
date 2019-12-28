// HTML web scraper for explorecourses.stanford.edu

const axios = require('axios');
const cheerio = require('cheerio');

// Example URL
// https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on

const url = "https://explorecourses.stanford.edu/print?filter-term-Winter=on&filter-catalognumber-AA=on&filter-academiclevel-GR=on&filter-coursestatus-Active=on&filter-catalognumber-AA=on&q=AA&descriptions=on&schedules=on"

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
		const meetings = [];
		const sections = $('.sectionDetails', course).each(function(i, meeting) {
			console.log("MEETING", $(this).text());
		});
		console.log("number", courseNumber, "title", courseTitle);
		//courses.push(retrieveDataFromSearchResult(course));
	});
}

function retrieveDataFromSearchResult(searchResult) {
	let courseInfo = searchResult('.courseResult');
	console.log("\nList:", courseInfo);
	courseInfo = courseInfo[0];
	console.log("\nFirst:", courseInfo);
	const courseNumber = courseInfo('.courseNumber');
	console.log("At course:", courseNumber);
}

