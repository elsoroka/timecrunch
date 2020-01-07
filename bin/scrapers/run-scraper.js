const fs   = require("fs");
const path = require("path");
const UciScraper = require("./uci-scraper.js")
const StanfordScraper = require('./stanford-scraper.js')

//runScraper(StanfordScraper);

// OK so I decoupled UciScraper from runScraper and it works
// But I don't know how to handle "any" scraper which implements the interface.
// Specifically, I am not sure what to do with the require line. ~emi

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

async function runScraper(scraper) {
	let schoolJson = {};
    depts  = scraper.departments();
    levels = scraper.levels();
    term   = scraper.currentTerm();
    // fill in the levels for schoolJson
    levels.forEach((level,_) => schoolJson[level] = {});

    depts.forEach((deptName, deptDelay) => {
        if (deptName != "") {
            levels.forEach((division, divDelay) => {
                let options = {
                    term: term,
                    department: deptName,
                    division: division
                };
				await sleep(deptDelay*5000 + divDelay*1000);
				scraper.run(options).then(writeJsonToFile);
            });
        }
    });
}

//scraper.run(options).then(json => {
function writeJsonToFile(json) {
	let fileName = `${scraper.formattedName()}.json`;
	schoolJson[options["division"]][options["department"]] = json;
	// If the filepath doesn't exist, create it
	const directory = path.resolve(__dirname, '..', 'university-data')
	if (!fs.existsSync(directory)){
		fs.mkdirSync(directory);
	}
	fs.writeFile(path.resolve(directory, fileName), JSON.stringify(schoolJson), err => {
		if (err) {
			console.log(err, schoolJson);
			console.log(options["division"], options["department"], "not ok");
		} else {
			//console.log(schoolJson);
			console.log(options["division"], options["department"], "ok");
		}
	});
}


module.exports = {runScraper} 
