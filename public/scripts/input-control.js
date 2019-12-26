// using jQuery
$( function() {

    console.log(`hello from jquery`);


    let deptList = ['--Select Department--'] //, 'AC ENG', 'ARABIC', 'MATH','IN4MATX'];
    let selectedUniversityName = undefined;

    /*
     * Programmatically create a department selection drop down box
     * This is somewhat like a client-side javascript version of 
     * the select_dept pug mixin in the old input-form.pug
     */
    let makeDepartmentDropDown = (dl) => {
        let label = document.createElement("LABEL");
        let dropDown = document.createElement("SELECT");
        let breakElement = document.createElement("BR");
        label.setAttribute("for", "dept_names");
        label.innerHTML = "Department:";
        dropDown.setAttribute("class", "department-selection form-control");
        //dropDown.setAttribute("class", "form-control");
        dropDown.setAttribute("id", "dept_names");
        dropDown.setAttribute("name", "dept_names");
        dl.forEach( dept => {
            let option = document.createElement("option");
            option.text = dept;
            dropDown.add(option);
        });
        dropDown.selectedIndex = "0";
        return [label, dropDown, breakElement];
    };

    ///////////////////////
    /* School Selection */
    //////////////////////
    $("#school-drop-down").attr( "selectedIndex", 0 );

    /*
     * School Select Event Listener
     * When the user selects a school from the drop down box
     */
    $("#school-drop-down").change( function() {
        console.log(`hello from school select event listener`);
        console.log($(this));
        console.log($(this)[0].selectedIndex);
        // no selection == -1, placeholder text == 0
        if ($(this).prop("selectedIndex") > 0) {
            // user selected school 
            let tempSchoolSelection = $(this).val();

            if (selectedUniversityName === undefined || selectedUniversityName !== tempSchoolSelection) {
                // new school choice
                selectedUniversityName = tempSchoolSelection; // remember this school choice
                // clear any previous input boxes and add a new one
                let departmentSelectionBoxes = $("#departments-group"); // TODO: send the name of this group from pug programmatically
                departmentSelectionBoxes.empty();
                $.get("/timecrunch/setSchool", {university_name: selectedUniversityName}, function(res) {
                    // load university's departments as list
                    deptList = new Set([...deptList, ...res.departments]) // remember these corresponding school departments
                    console.log(res.departments);
                    console.log(deptList);
                    // add a drop-down box for the user to select a department
                    let labeledDepartmentSelect = makeDepartmentDropDown(deptList);
                    departmentSelectionBoxes.append(labeledDepartmentSelect);
                });
            }
        }
        $("#school-drop-down").blur();
    });


    /////////////////////////
    /* Submit Demographics */
    /////////////////////////

    function getSelectedUniversity(){
        if (selectedUniversityName === undefined)
            return; // TODO: add a nice UI element telling the user they didn't select a university 
        return selectedUniversityName;
    }

    function getSelectedDepartments() {
        let depts = new Set();
        $.each($(".department-selection option:selected"), function(){
            depts.add($(this).val());
        });
        return Array.from(depts);
    }

    function getSelectedDivisions() {
    }

    function getDemographics() {
        let demographics = new FormData();
        university = getSelectedUniversity();
        departments = getSelectedDepartments();
        console.log(university);
        console.log(departments);
        // TODO: add divisions
        //divisions = getSelectedDivisions();
        demographics.append('university', university);
        demographics.append('departments', departments);
        //demographics.append('divisions', divisions);
        return new URLSearchParams(demographics); // express body-parser doesn't 
        // accept FormData so send back as url encoded query params
        // cf. https://developer.mozilla.org/en-US/docs/Web/API/FormData
        /*
            It uses the same format a form would use if the encoding type were 
            set to "multipart/form-data".

            You can also pass it directly to the URLSearchParams constructor 
            if
            you want to generate query parameters in the way a <form> would do
            if it were using simple GET submission. 
        */
    }

    $("#demographics-form").submit( function(evt) {
        console.log(`hello from department form event listener`);
        evt.preventDefault();
        let postUrl = $(this).attr("action"); 
        let requestMethod = $(this).attr("method");
        let formData = getDemographics();
        console.log(formData.toString());
        for (let p of formData)
            console.log(p);
        $.ajax({
            url: postUrl,
            type:  requestMethod,
            data: formData.toString()
            //cache: false,
            //contentType: false,
            //processData: false,
        }).done(response => {
            let heatmapDiv = $("#heatmap");
            heatmapDiv.empty();
            //heatmapDiv.html("<p>hello world</p>");
            buildHeatmap(response);
            console.log(response);
        });
    });

    $("#departments-form").change( function() {
        console.log(`hello from department select event listener`);
        console.log($(this));
    });
});

