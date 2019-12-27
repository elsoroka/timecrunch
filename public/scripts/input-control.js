// using jQuery
$( function() {

    console.log(`hello from jquery`);

    let deptList = ['--Select Department--'];
    let divisionList = ['--Select Division--'];
    let selectedUniversityName = undefined;
    let demographicRowId = 0;

    /*
     * Programmatically create a department selection drop down box
     * This is somewhat like a client-side javascript version of 
     * the select_dept pug mixin in the old input-form.pug
     */
    function makeDemographicDropDown(demList, labelSettings, dropDownSettings) {
        let label = document.createElement("LABEL");
        let dropDown = document.createElement("SELECT");
        let breakElement = document.createElement("BR");
        label.setAttribute("for", labelSettings.forAttr);
        label.innerHTML = labelSettings.innerHTML;
        dropDown.setAttribute("class", dropDownSettings.classAttr);
        dropDown.setAttribute("id", dropDownSettings.idAttr);
        dropDown.setAttribute("name", dropDownSettings.nameAttr);
        demList.forEach(dem => {
            let option = document.createElement("option");
            option.text = dem;
            dropDown.add(option);
        });
        dropDown.selectedIndex = "0";
        return [label, dropDown, breakElement];

    }

    function makeDemographicObject(selectorStr, demList, forStr, innerHtmlString, classStr, idStr, nameStr){
        return {
            dropDowns: $(selectorStr),
            demographicList: demList,
            labelSettings: {forAttribute: forStr, innerHTML: innerHtmlString },
            dropDownSettings: {classAttr: classStr, idAttr: idStr, nameAttr: nameStr}
        }
    }

    // div col-auto
    //      <(Click to Add Dept)>  <(click to Add Division)>
    // div col with a button in it
    function createButtonColumn(couplingClass, uniqueId, buttonText) { 
        let col = document.createElement("div");
        let btn = document.createElement("button");
        // apply class to column and id to button
        col.className = `col-auto ${couplingClass}`;
        btn.id = uniqueId;
        btn.innerHTML = `<p>${buttonText}</p>`; // label the button
        $(btn).appendTo(col); // place button in the column
        return col;
    };

    ///////////////////////
    /* School Selection */
    //////////////////////
    // Initialize school selection to placeholder
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
                $.get("/timecrunch/setSchool", {university_name: selectedUniversityName}, function(res) {
                    let deptsNameLabel = "dept_names", divsNameLabel = "division_names";
                    let demographics = [];//new Array(2)

                    // load university's departments as list
                    deptList = new Set([...deptList, ...res.departments]) // remember these corresponding school departments
                    divisionList = new Set([...divisionList, ...res.divisions]) // remember these corresponding school divisions

                    // TODO: send the id of the group (first argument below) from pug programmatically, they correspond to input-form.pug
                    // alls of these settings accept the lists actually seem like they should be defined as instances 
                    // of a Demographic Class in the server and passed here
                    demographics.push(makeDemographicObject("#departments-group", deptList,
                                                            deptsNameLabel ,"Department:",
                                                            "department-selection form-control", deptsNameLabel, deptsNameLabel));
                    demographics.push(makeDemographicObject("#divisions-group", divisionList,
                                                            divsNameLabel ,"Division:",
                                                            "division-selection form-control", divsNameLabel, divsNameLabel));

                    // clear demographic row id
                    demographicRowId = 0;
                    let rowId = `demographic-row-${demographicRowId}`; 
                    let buttonIdPrefix = `button-${rowId}`;
                    
                    //create the row from the inside out with the help of jquery's .wrap() function
                    //makeDemographicButtons(rowId, buttonIdPrefix);
                    // make two div columns each with a button inside:
                    // require that the two buttons be linked via a class name that no other buttons have
                    // and that the button itself can be uniquely identified via rowNum + [div|dep]
                    let divisionButtonColumn    = createButtonColumn(buttonIdPrefix, `${buttonIdPrefix}-add-div`, "Add Division");  
                                                                    //  uniqueId,                    buttonText
                    let departmentButtonColumn  = createButtonColumn(buttonIdPrefix, `${buttonIdPrefix}-add-dep}`, "Add Column");

                    // attach the coupled buttons to the row container without a row
                    $("#demographics-rows-group").append(divisionButtonColumn);
                    $("#demographics-rows-group").append(departmentButtonColumn);
                    
                    // create a div form-row to hold the columns
                    let formRowDiv = document.createElement("div");
                    formRowDiv.className = "form-row";
                    formRowDiv.id = rowId;

                    // use their common class of the columns to safely wrap them and nothing else 
                    $(`.${buttonIdPrefix}`).wrapAll( $(formRowDiv) );
                    // We now have have a row with two buttons in it



                    /*
                    // add "Demographic" div
                    let demographicsDiv = $("#demographics-rows-group")
                    let formRowDiv = document.createElement("div");
                        .appendTo(demographicsDiv);
                    //demographicsDiv.append($("<div class=row>")
                    // append Division Div to DemographicRow
                    let demographicsRow = $(rowId);
                    $(demographicsRow)
                        .append(makeDemographicButtons(idx, html));
                        .appendTo(demographicsRow);
                    */

                    /*
                    demographics.forEach(dem => {
                        // clear any previous input boxes and start fresh
                        dem.dropDowns.empty();
                        console.log(dem.demographicList);
                        // add a drop-down box for the user to select a department
                        let labeledDemographicSelect = makeDemographicDropDown(dem.demographicList, dem.labelSettings, dem.dropDownSettings);
                        dem.dropDowns.append(labeledDemographicSelect);
                    });
                    */

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


    // warning: not using this right now using the more general version below 
    // but TODO: allow for things like lower MATH + upper ARABIC  etc.
    function getSelectedDepartments() {
        let depts = new Set();
        $.each($(".department-selection option:selected"), function(){
            if ($(this).val() === deptList[0]) // Don't add the placeholder
                return;
            depts.add($(this).val());
        });
        return Array.from(depts);
    }

    function getSelectedDemographic(selectorStr, placeholder) {
        let depts = new Set();
        $.each($(selectorStr), function(){
            if ($(this).val() === placeholder) // Don't add the placeholder
                return;
            depts.add($(this).val());
        });
        return Array.from(depts);
    }

    function getDemographics() {
        let demographics = new FormData();
        university = getSelectedUniversity();
        departments = getSelectedDemographic(".department-selection option:selected", deptList[0]);
        divisions = getSelectedDemographic(".division-selection option:selected", divisionList[0]);
        console.log(university);
        console.log(departments);
        console.log(divisions);
        // TODO: add divisions
        //divisions = getSelectedDivisions();
        demographics.append('university', university);
        demographics.append('departments', departments);
        demographics.append('divisions', divisions);
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

