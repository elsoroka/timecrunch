/*
 * Emit a timestamp in web console
 */
// TODO: make this a reusable function and arrange so that both server and client can use it
let days_ts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let months_ts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Day HR:MIN:SS:MS Month DayNum Year
let getFormattedTimeStamp = (timestamp) => 
    days_ts[timestamp.getDay()] + " " 
    + timestamp.getHours() + ":" 
    + ("00" + timestamp.getMinutes()).slice(-2) + ":" 
    + ("00" + timestamp.getSeconds()).slice(-2) + ":" 
    + timestamp.getMilliseconds() + " " 
    + months_ts[timestamp.getMonth()] + " " 
    + timestamp.getDate() + " " 
    + timestamp.getFullYear();
//console.log(`[${getFormattedTimeStamp()}] Initializing heatmap...`); 
console.log(`[${getFormattedTimeStamp(new Date)}] Initializing heatmap...`);

/* removing
console.log(JSON.stringify(hm));
console.log(weekdayNames);
console.log(timeIncrements);
*/


// GET request served the page
if (server_data.init === "init") {
    console.log(`GET request rendered page... building empty heatmap`);
    console.log(`server_data: ${server_data.heatmap}`);
    // the page rendering appears faster if the initial empty heatmap is 
    // sent from the server rather than using AJAX
    /*
    $.get("initializeHeatmap", function(response) {
        let heatmapDiv = $("#heatmap");
        heatmapDiv.empty(); // should already be empty but just in case
        //heatmapDiv.html("<p>hello world</p>");
        buildHeatmap(response);
    });
    */
    buildHeatmap(server_data);
};



function buildHeatmap(heatmapJson) {
    const hm = heatmapJson.heatmap;
    const weekdayNames = heatmapJson.weekdayNames;
    const timeIncrements = heatmapJson.timeIncrements;
    //console.log(`server_data.heatmap: ${server_data}`);

    // TODO: programmatically determine width and height 
    // set the dimensions and margins of the graph
    const margin = {top: 90, right: 10, bottom: 100, left: 70};//$('#input-form-container').width()}
    //let width = document.getElementById('schedule-container').offsetWidth - margin.left - margin.right;
    console.log(`wrapper-width= ${$('.wrapper').width()}`);
    console.log(`input-forrm-width= ${$('#input-form-container').width()}`);
    console.log(`window-width= ${$(document).width()}`);
    console.log(`schedule-container-width=${$('#schedule-container').width()}`);
    let remainingWidth = $(document).width() - $('#input-form-container').width();// - $('#heatmap-container').width();

    let width =  $("#schedule-container").width() - margin.left - margin.right;
    console.log(`width=${width}`);
    let height = $("#schedule-container").height() - margin.top - margin.bottom;

    //window.onresize = function(){ location.reload(); }

    /*
     * Heatmap Dimensions and Placement
     */

    // append the svg object to the body of the page
    let svg = d3.select("#heatmap")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    /*
     * Title
    */
    // Add title to graph
    /*
    svg.append("text")
        .attr("x", 0)
        .attr("y", -60)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text("timecrunch");
        */

    // Add subtitle to graph
    svg.append("text")
        .attr("x", 0)
        .attr("y", -60)
        .attr("text-anchor", "left")
        .style("font-size", "22")
        //.style("fill", "grey")
        .style("max-width", 400)
        .text("when are students in class?")

    /*
     * Tooltip Mouse Hover Info
     */
    // create a tooltip
    let tooltip = d3.select("#heatmap")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    let mouseover = function(d) {
        tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
    }

    let mousemove = function(d) {
        tooltip
          .html(d.value + " students in class " + d.classnames)
          .style("left", (d3.mouse(this)[0]+10) + "px")
          .style("top", (d3.mouse(this)[1]) + "px")
    }

    let mouseleave = function(d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", 0.8)
    }

    /*
     * Axis styles
     */

    // Prepare the group elements for X and Y axes in the svg
    svg.append("g")
        .attr("id", "day-axis")
        .style("font-size", 22)
        .style("font-weight", 700)
        .style("font-family", "Quicksand, sans-serif")
        .attr("transform", "translate(0," + 0 + ")")
        .classed("x axis", true)
        //.select(".domain").remove()

    svg.append("g")
        .attr("id", "time-axis")
        .style("font-size", 16)
        .style("font-weight", 700)
        .style("font-family", "Quicksand, sans-serif")
        .attr("transform", "translate(0," + -24 + ")")
        .classed("y axis", true)

    /*
     * Temporary Index-Based X and Y scales 
     *  Use numbers as the domains to more easily access a cell when populating the table.
     *  These scales get replaced by string labels for the domain after the table is built.
     */
    // Build X and Y scales
    // TODO: use length of the domains instead of hardcoded 5 and 84
    let x = d3.scaleBand()
        .range([ 0, width ])
        .domain(Array.from({length:5},(_,i)=>i))//weekdayNames) 

    let y = d3.scaleBand()
        .range([ 0, height ])
        .domain(Array.from({length:84},(_,i)=>i))  //timeIncrements

    /*
     * Heatmap Colorscheme
     */
    // Build color scale
    // Make an array of just the counts for doing the colors
        // ~emi
    let hmCounts = new Array(hm.length).fill(0).map(
        (_, i) => new Array(hm[i].length).fill(0).map((_, j) => hm[i][j].count));

    let myColor = d3.scaleLinear()
        //scaleSequential().interpolator(d3.interpolateInferno)
        .domain([0, Math.max(...[].concat(...hmCounts))/2])
                //d3.max(hm, function(d) {return d.count; })/2, d3.max(hm, function(d) {return d.count;})])
        .range(["#CBEBF6", "#3E9583"]);
    //.range(["#FFFFDD", "#3E9583", "#1F2D86"]);  //original colorscheme
   
    // add the squares
    let allArr = svg.selectAll()
        .data(hm)//, function(d,i,j) {console.log(`d=${d},i=${i}`);return d})
        .enter()
        .append("g")
        .selectAll("rect")
        .data(function (d,i) {
            //console.log(`d=${d},i=${i}`);
            //d.forEach(function(dat){ console.log(dat); });
            return Array.from(d, function(x){
                return {value: x.count, row: i, classnames:x.classnames};
            });//{datum:d, rowidx: i};}) // what is d?
        })
        .enter()
        .append("rect")
        .attr("x", function(d,i,j) {
            //console.log(`d=${d.value},j=${i%5},rowi=${d.row}`);
            return x(i%5);
        })
        .attr("y", function(d,i,j) {
            //console.log(`y()=${d.row}:${y('8:00p')}`);
            return y(d.row);
        })
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d.value)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)

    // Replace X and Y Scales with string labels
    x = d3.scaleBand()
        .range([ 0, width ])
        .domain(weekdayNames)//Array.from({length:5},(_,i)=>i))//weekdayNames_cus)
        .padding(0.05);

    y = d3.scaleBand()
        .range([ 0, height ])
        .domain(timeIncrements)//Array.from({length:84}, (_,x)=>x+'8:00a'))//timeIncrements)//Array.from({length:84},(_,i)=>i))  //timeIncrements
        .padding(-1.11);


    // Render X and Y axis
    svg.select("#day-axis")
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove()

    svg.select("#time-axis")
        .call(
            d3.axisLeft(y)
            .tickSize(0)
        )
        .select(".domain").remove()
}
