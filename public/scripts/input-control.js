// using jQuery
$( function() {
    console.log(`hello from jquery`);

    /* TODO: refactor
     * integrating my codepen toy-example 
     * so parts of this may look patchy and messy
     * */
    
    // Globals
    let demRowCount = 0;
    let demographicDropdownId = 0
        departmentDropdownId = 0,
        divisionDropdownId = 0;  
    let departmentListPlaceholder   = "Any Department",
        divisionListPlaceholder      = "Any Course Level";

    let departmentList  =   [departmentListPlaceholder];
    let divisionList    =   [divisionListPlaceholder];
    let selectedUniversityName = undefined;

    console.log(`hello from jquery`);

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
            demographicId: demographic.containerId,
            departmentId: department.containerId,
            divisionId: division.containerId
        }));

        addOptionsToDemList(department.demList, department.containerId);
        addOptionsToDemList(division.demList, division.containerId);
    }

    // replace Add <Demographic> with corresponding Selection dropdown  box
    $('#demographics-rows-group').on('click', '.add-demog-btn', function() {
        if($(this).hasClass('add-demog-btn')) {
            ++demRowCount;
            replaceWithSelectionDropdowns(
                $(this).parent(), 
                demographicDropdown,
                { 
                    containerId: demographicDropdownId,
                    department: { 
                        containerId: `department-dropdown-${demographicDropdownId}`, 
                        demList: departmentList 
                    },
                    division: { 
                        containerId: `division-dropdown-${demographicDropdownId}`, 
                        demList: divisionList 
                    }
                }
            );
            ++demographicDropdownId;
        }

        // add next row of buttons 
        $('#demographics-rows-group').append(demogButtons());
    });

    // remove dropdown  boxes
    $('#demographics-rows-group').on('click', '.remove-demog-btn', function() {
        console.log('removing demogs');
        if($(this).hasClass('remove-demog-btn')) {
            --demRowCount;
            console.log('checking parent');
            console.log($(this).parent())
            $(this).parent().parent().parent().parent().remove()
        }
        $('#demographics-rows-group').trigger('change');

    });


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
    let isDropdownOpen = 0;
    $("#school-drop-down").on('show.bs.select', function() {
        console.log($(this));
		let universitySelect = $(this);
		let dropdownMenu = universitySelect.find(".dropdown-menu")
		console.log(dropdownMenu);
		dropdownMenu = dropdownMenu[0];
        console.log(`isdropdownopne = ${isDropdownOpen}`);
        ++isDropdownOpen;
        console.log(`isdropdownopne = ${isDropdownOpen}`);
        if (isDropdownOpen == 1) {
			$('#schedule-container').append(dropdownMenu);
			/*
			var eOffset = 500;
			dropdownMenu.css({
				'display': 'block',
				'top': eOffset,
				'left': eOffset
			});
            $("#schedule-container").append($('#school-drop-down').css({
                position: 'absolute',
                left: $('#school-drop-down').offset().left,
                top: $('#school-drop-down').offset().top
            }).detach());
			*/
            isDropdownOpen = -1;
			console.log(`isdropdownopne = ${isDropdownOpen}`);
        }
	});

    $("#school-drop-down").change( function() {
		let loadSortedDemographicsList = (dl, rl) => {
			let placeholder = [dl[0]];
			dl = Array.from(new Set([...rl])).filter(Boolean).sort(); // remove duplicates and empty values
			return Array.from(placeholder.concat(dl));
		};
        console.log(`hello from school select event listener`);
        console.log($(this));
        console.log($(this)[0].selectedIndex);
        // no selection == -1, placeholder text == 0
        if ($(this).prop("selectedIndex") > 0) {
            // user selected school 
            let tempSchoolSelection = $(this).val();
            console.log(`selected school: ${$(this).val()}`);
            if (selectedUniversityName === undefined || selectedUniversityName !== tempSchoolSelection) {
                // new school choice
                selectedUniversityName = tempSchoolSelection; // remember this school choice
                $('#demographics-rows-group').children().remove(); // remove any previous demographics html elements
                divisionList = [divisionListPlaceholder];
                departmentList = [departmentListPlaceholder];

                $.get("/timecrunch/setSchool", {university_name: selectedUniversityName}, function(res) {
                    let demographics = [];//new Array(2)

                    // load demographics from server
					departmentList = loadSortedDemographicsList(departmentList, res.departments);
					divisionList = Array.from(new Set([...divisionList, ...res.divisions]));

                    // add first row of buttons -- when school choice is selected
                    $('#demographics-rows-group').append(demogButtons());
					$('#demographics-rows-group button').trigger("click");

                });
				// show demographics prompt:
				$('.input-form-title').addClass("school-is-selected");
            }
        }
        $("#school-drop-down").blur();
    });

    /*---------------------------
     * Demographic Selection 
     * --------------------------*/
    // Initialize school selection to placeholder
    $("#school-drop-down").attr( "selectedIndex", 0 );
    /*
     * School Select Event Listener
     * When the user selects a school from the drop down box
     */
    //$("#school-drop-down").change( function() {
    
    /*---------------------------
     * Submit Demographics 
     * --------------------------*/

    function getSelectedUniversity(){
        if (selectedUniversityName === undefined)
            return; // TODO: add a nice UI element telling the user they didn't select a university 
        return selectedUniversityName;
    }

    function getSelectedDemographic(thisRow, selectorStr, placeholder = "--") {
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

    function getDemographicQueries(selectorStr, placeholder) {
        let demographicRequest = [] //new Set(); // [ { [], [] },  ]
        console.log(`demographic rows via selectorstr=${selectorStr}`);
        $.each($(".demographic-row"), function(){
            let depts = getSelectedDemographic($(this), ".department-selection option:selected", departmentListPlaceholder);
            let divis = getSelectedDemographic($(this), ".division-selection option:selected", divisionListPlaceholder);
            let query = {departments: depts, divisions: divis}
            console.log(`query=${query.departments}|${query.divisions}`);
            // at least one must be selected to be considered valid query
            // i.e. disallow search for all classes via the dropdowns
            if (depts.length != 0 || divis.length != 0)
                demographicRequest.push(query);
        });
        return demographicRequest;
    }

    function getDemographics() {
        //let demographics = new FormData();
        let demographics = {};//university: 
        demographics.university =  getSelectedUniversity();
        demographics.selections = getDemographicQueries();
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
        let isNonEmpty = al => al.length != 0;
        let rebuildHeatmap = hm => {
            $("#heatmap").empty();
            buildHeatmap(hm);
        };
        let isNonEmptySelection = sel => isNonEmpty(sel) && 
            (isNonEmpty(sel.departments) || isNonEmpty(sel.divisions));

        console.log(`hello from demographics rows event listener`);
        evt.preventDefault();
        let postUrl = '/timecrunch';//$(this).attr("action"); 
        let requestMethod = "POST";//$(this).attr("method");
        let demographicJson = getDemographics();
        console.log(demographicJson);
        console.log(demographicJson.selections.length);
        if (isNonEmpty(demographicJson.selections)) {
            // then ask server for heatmap 
            console.log('using ajax');
            //console.log(formData.toString());
            //for (let p of formData) console.log(p);
            $.ajax({
                url: postUrl,
                type:  requestMethod,
                data: JSON.stringify(demographicJson),
                contentType: "application/json",
                //dataType
                //cache: false,
                //processData: false,
            }).done(heatmapJson => {
                rebuildHeatmap(heatmapJson);
                console.log(heatmapJson);
            });
        }
        else { //empty selections? use emptyHeatmap
            console.log(`empty selections? use emptyHeatmap`);
            rebuildHeatmap(emptyHeatmapJson);
            console.log(emptyHeatmapJson);
        }
    });

    $("#departments-form").change( function() {
        console.log(`hello from department select event listener`);
        console.log($(this));
    });
});

