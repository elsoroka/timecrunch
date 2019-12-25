const fs   = require("fs");
const path = require("path");
const UciScraper = require("./uci-scraper.js")

var finalJson = {};
runScraper(UciScraper);

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
                options = {
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
    return () => callWebSoc(scraper, options).then(json => {

        let fileName = "final.json";
        for (let [key, value] of Object.entries(json)) {
            level = options["division"];
            finalJson[level][key] = value;
        }

        fs.writeFile(path.resolve(__dirname, '..', 'university_data', scraper.name(), fileName), JSON.stringify(finalJson), err => {
            if (err) {
                console.log(err, finalJson);
                console.log(options["division"], options["department"], "not ok");
            } else {
                console.log(options["division"], options["department"], "ok");
            }
        });
    });
}

function callWebSoc(scraper, options) {
    return new Promise( resolve => {
        const result = scraper.run(options);

        result.then((json) => {
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
            resolve(final_res);
        });
    });
}
