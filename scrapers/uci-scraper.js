const WebSocAPI = require('websoc-api');
const fs = require("fs");
const path = require("path")

uciDepts = fs.readFileSync(path.resolve(__dirname, "uci-depts.txt"), "utf-8").split('\n');
uciDepts.forEach((deptName, deptDelay) => {
    if (deptName != "") {
        ["LowerDiv", "UpperDiv", "Graduate"].forEach((division, divDelay) => {
            options = {
                term:'2020 Winter',
                department: deptName,
                division: division
            };
            setTimeout(cb(options), deptDelay*5000+ divDelay*1000);
        });
    }

});

function cb(options) {
    return () => callWebSoc(options).then(json => {
        let data = JSON.stringify(json);
        let div = options["division"].toLowerCase().replace("div", "");
        let deptName = options["department"].replace("/", "_");

        var fileName = options["term"] + " " + div + " ";
        fileName = fileName.toLowerCase().replace(/ /g, "-");
        fileName += deptName + ".json";

        fs.writeFile(path.resolve(__dirname, '..', 'data', 'uci', fileName), data, err => {
            if (err)
                console.log(fileName, "not ok");
            else
                console.log(fileName, "ok")
        });
    });
}

function callWebSoc(options) {
    return new Promise( resolve => {
        const result = WebSocAPI.callWebSocAPI(options);
        finalJson = { "depts" : []};
        result.then((json) => {
            final_res = { };
            schools = []
            json["schools"].forEach(school => {
                depts = [];
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
                    depts.push({"deptCode": department["deptCode"],
                                "courses": courses});
                });
                let res = { "schoolName" : school["schoolName"],
                            "depts": depts};
                schools.push(res);
                final_res = {schools};
            });
            //console.log(final_res["depts"]);
            //console.log(JSON.stringify(final_res));
            resolve(final_res);
        });
    });
}
