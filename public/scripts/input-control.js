// using jQuery
$( function() {
    console.log(`hello from jquery`);

    /* TODO: refactor
     * integrating my codepen toy-example 
     * so parts of this may look patchy and messy
     * */
    

    Handlebars.registerHelper('var',function(name, value, context){
      this[name] = value;
    });

    // Globals
    let finishedArr = [];
    let departmentDropdownCount = 0;
    let departmentDropdownId = 0;
    let divisionDropdownId = 0;  
    let currentRow = 0;
    let departmentList = ['--Select Department--'];
    let divisionList = ['--Select Division--'];
    let selectedUniversityName = undefined;
    let demographicRowId = 0;


    const demographicDropdown = Handlebars.compile($("#demographic-dropdowns-template").html());

    const demogButtons = Handlebars.compile($('#add-demographic-button-template').html());


    /*
     * Programmatically create a demographic selection drop down box
     * This is somewhat like a client-side javascript version of 
     * the select_dept pug mixin in the old input-form.pug
     */

    function addOptionsToDemList(demList, dropdownContainer) {
        let dropDown = $(`#${dropdownContainer} select`);
        console.log(demList);
        console.log(dropDown);
        demList.forEach(dem => {
            let option = document.createElement("option");
            option.text = dem;
            dropDown.append(option);
        });
    }

    function replaceWithSelectionDropdowns(thisParent, dropdownTemplate, demographic) {
        let department = demographic.department, 
            division = demographic.division;

        thisParent.html(dropdownTemplate({
            departmentId: department.containerId,
            divisionId: division.containerId
        }));

        addOptionsToDemList(department.demList, department.containerId);
        addOptionsToDemList(division.demList, division.containerId);
    }

    // replace Add <Demographic> with corresponding Selection dropdown  box
    $('#demographics-rows-group').on('click', 'button', function() {
        if($(this).hasClass('add-demog-btn')) {
            replaceWithSelectionDropdowns(
                $(this).parent(), 
                demographicDropdown,
                { 
                    department: { 
                        containerId: `department-dropdown-${departmentDropdownId}`, 
                        demList: departmentList 
                    },
                    division: { 
                        containerId: `division-dropdown-${divisionDropdownId}`, 
                        demList: divisionList 
                    }
                }
            );

            ++departmentDropdownId;
            ++divisionDropdownId;
            ++departmentDropdownCount;
        }

        // add next row of buttons 
        $('#demographics-rows-group').append(demogButtons());
    });

    function finish() {
        console.log(finishedArr);
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
                    departmentList = new Set([...departmentList, ...res.departments]) // remember these corresponding school departments
                    divisionList = new Set([...divisionList, ...res.divisions]) // remember these corresponding school divisions

                    // add first row of buttons -- when school choice is selected
                    $('#demographics-rows-group').append(demogButtons());

                    // TODO: send the id of the group (first argument below) from pug programmatically, they correspond to input-form.pug

                });
            }
        }
        $("#school-drop-down").blur();
    });

    ///////////////////////////
    /* Demographic Selection */
    //////////////////////////
    // Initialize school selection to placeholder
    $("#school-drop-down").attr( "selectedIndex", 0 );
    /*
     * School Select Event Listener
     * When the user selects a school from the drop down box
     */
    //$("#school-drop-down").change( function() {
    
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
    function getSelectedDemographic(thisRow, selectorStr, placeholder = "--Select ") {
        let demRow = [] 
        $.each(thisRow.find(selectorStr), function(_, option) {
            if (!option.text.startsWith(placeholder))
                demRow.push(option.text);
        });
        return demRow;
            //.reduce(function(options, opt) {
            console.log(opt);
            if (!this.value.startsWith(placeholder))
                options.push(this.value);
            return options;
            console.log($(this).value);
            console.log($(this).text);
            console.log(this);
            console.log(this.value);
        //});
        // no selection will have special meaning [-1] to be detected by server
        return demRow;
    }

    function getDemographicRows(selectorStr, placeholder) {
        let demographicRequest = [] //new Set();
        // [ { [], [] },  ]
        //
        console.log(`dm`);
        $.each($(".demographic-row"), function(){
            let depts = getSelectedDemographic($(this), ".department-selection option:selected");
            let divis = getSelectedDemographic($(this), ".division-selection option:selected");
            let query = {departments: depts, divisions: divis}
            console.log(`query=${query.departments}|${query.divisions}`);
            demographicRequest.push(query);
        });
        return demographicRequest;
    }

    function getDemographics() {
        //let demographics = new FormData();
        let demographics = {};//university: 
        demographics.university =  getSelectedUniversity();
        demographics.selections = getDemographicRows();
        console.log(demographics.university);
        console.log(demographics.selections[0]);
        // TODO: add divisions
        //divisions = getSelectedDivisions();
        //demographics.append('departments', departments);
        //demographics.append('divisions', divisions);
        //demographics.append('divisions', divisions);
        console.log(`json=${JSON.stringify(demographics)}`);
        return demographics;
        //return new URLSearchParams(demographics); // express body-parser doesn't 
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



    $('#demographics-rows-group').change(function(evt) {
        console.log(`hello from demographics rows event listener`);
        evt.preventDefault();
        let postUrl = '/timecrunch';//$(this).attr("action"); 
        let requestMethod = "POST";//$(this).attr("method");
        let demographicJson = JSON.stringify(getDemographics());
        //console.log(formData.toString());
        //for (let p of formData) console.log(p);
        $.ajax({
            url: postUrl,
            type:  requestMethod,
            data: demographicJson,
            contentType: "application/json",
            //dataType
            //cache: false,
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

