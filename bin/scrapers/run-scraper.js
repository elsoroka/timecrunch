const fs   = require("fs");
const path = require("path");
const UciScraper = require("./uci-scraper.js")
const StanfordScraper = require('./stanford-scraper.js')

var finalJson = {};
runScraper(StanfordScraper);

// OK so I decoupled UciScraper from runScraper and it works
// But I don't know how to handle "any" scraper which implements the interface.
// Specifically, I am not sure what to do with the require line. ~emi

function runScraper(scraper) {
    depts  = scraper.departments();
    levels = scraper.levels();
    term   = scraper.currentTerm();
    // fill in the levels for finalJson
    levels.map( (level,_) => finalJson[level] = {} );

    depts.forEach((deptName, deptDelay) => {
        if (deptName != "") {
            levels.forEach((division, divDelay) => {
                let options = {
                    term: term,
                    department: deptName,
                    division: division
                };
                setTimeout(cb(scraper, options), deptDelay*5000+ divDelay*1000);
            });
        }
    });
}

function cb(scraper, options) {
    return () => scraper.run(options).then(json => {
        let fileName = "final.json";
        /*
        for (let [key, value] of Object.entries(json)) {
            level = options["division"];
            finalJson[level][key] = value;
        }*/
        // TODO: Questionable nesting here - should department contain division? ~emi
        // the json object should be a list of Course objects
        finalJson[options["division"]][options["department"]] = json;
        // If the filepath doesn't exist, create it
        const directory = path.resolve(__dirname, '..', 'university-data', scraper.name());
        if (!fs.existsSync(directory)){
            fs.mkdirSync(directory);
        }
        fs.writeFile(path.resolve(directory, fileName), JSON.stringify(finalJson), err => {
            if (err) {
                console.log(err, finalJson);
                console.log(options["division"], options["department"], "not ok");
            } else {
                //console.log(finalJson);
                console.log(options["division"], options["department"], "ok");
            }
        });
    });
}
