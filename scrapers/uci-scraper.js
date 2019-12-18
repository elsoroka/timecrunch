const WebSocAPI = require('websoc-api');

options = {
    term:'2019 Winter',
    department:'I&C SCI'
}

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
    console.log(JSON.stringify(final_res));
});
