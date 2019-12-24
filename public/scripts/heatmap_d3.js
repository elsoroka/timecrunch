// be informed by the server data
/*
mixin 10minutes(name, index)
  // Construct a row. If data exists (not undefined), index into it and use the numbers there.
  tr
    td.hour= name
    // See if we have data passed in from layout
    - if ((undefined == data) || (index >= data.length)) 
      -{ row1 = [0,0,0,0,0]; }
    - else { console.log(data[index]); row1 = data[index] }

    each val in row1
      td.people= val
*/
if (server_data.init == "init") {
    console.log("wow passed data here...");
};

date = new Date();

weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var dateString = weekdayNames[date.getDay()] + " " 
    + date.getHours() + ":" + ("00" + date.getMinutes()).slice(-2) + ":" + ("00" + date.getSeconds()).slice(-2) + ":" + date.getMilliseconds() + " " 
    + date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();

console.log("Initializing..." + dateString); 


// TODO: programmatically determine width and height 
// set the dimensions and margins of the graph
var margin = {top: 100, right: 25, bottom: 30, left: 70},
  width = 950 - margin.left - margin.right,
  height = 850 - margin.top - margin.bottom;


console.log(JSON.stringify(hm));
// append the svg object to the body of the page
var svg = d3.select("#heatmap")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Read the data
console.log(weekdayNames_cus);
console.log(timeIncrements);

// Build X scales and axis:
var x = d3.scaleBand()
    .range([ 0, width ])
    .domain(Array.from({length:5},(_,i)=>i))//weekdayNames_cus)
    .padding(0.05);

console.log(JSON.stringify(timeIncrements));
svg.append("g")
    .attr("id", "day-axis")
    .style("font-size", 15)
    .attr("transform", "translate(0," + 0 + ")")
    .classed("x axis", true)
    .call(d3.axisTop(x).tickSize(0))
    //.select(".domain").remove()

// Build Y scales and axis:
var y = d3.scaleBand()
    .range([ 0, height ])
    .domain(Array.from({length:84},(_,i)=>i))  //timeIncrements
    .padding(0.01);

svg.append("g")
    .attr("id", "time-axis")
    .style("font-size", 15)
    .attr("transform", "translate(0," + 0 + ")")
    .classed("y axis", true)

// Build color scale
var myColor = d3.scaleLinear()
    //.interpolator(d3.interpolateInferno)
    .domain([0, Math.max(...[].concat(...hm))/2])
    .range(["#FFFFDD", "#3E9583", "#1F2D86"]);
        //d3.max(hm, function(d) {return d.count; })/2, d3.max(hm, function(d) {return d.count;})])

// create a tooltip
var tooltip = d3.select("#heatmap")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

// Three function that change the tooltip when user hover / move / leave a cell
var mouseover = function(d) {
tooltip
  .style("opacity", 1)
d3.select(this)
  .style("stroke", "black")
  .style("opacity", 1)
}
var mousemove = function(d) {
tooltip
  .html("The exact value of<br>this cell is: " + d.value)
  .style("left", (d3.mouse(this)[0]+70) + "px")
  .style("top", (d3.mouse(this)[1]) + "px")
}
var mouseleave = function(d) {
tooltip
  .style("opacity", 0)
d3.select(this)
  .style("stroke", "none")
  .style("opacity", 0.8)
}

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
            return {value: x, row: i};
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

// Build X scales and axis:
x = d3.scaleBand()
    .range([ 0, width ])
    .domain(weekdayNames_cus)//Array.from({length:5},(_,i)=>i))//weekdayNames_cus)
    .padding(0.05);

svg.select("#day-axis")
    .style("font-size", 15)
    .attr("transform", "translate(0," + 0 + ")")
    .call(d3.axisTop(x).tickSize(0))
    .select(".domain").remove()

// Build Y scales and axis:
y = d3.scaleBand()
    .range([ 0, height ])
    .domain(timeIncrements)//Array.from({length:84}, (_,x)=>x+'8:00a'))//timeIncrements)//Array.from({length:84},(_,i)=>i))  //timeIncrements
    .padding(0.01);

svg.select("#time-axis")
    .style("font-size", 15)
    .attr("transform", "translate(10," + -1 + ")")
    .call(
        d3.axisLeft(y)
        .tickSize(0)
    )
    .select(".domain").remove()

/*
*/

// Add title to graph
svg.append("text")
    .attr("x", 0)
    .attr("y", -60)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("timecrunch");

// Add subtitle to graph
svg.append("text")
    .attr("x", 0)
    .attr("y", -40)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .style("max-width", 400)
    .text("when are students in class?")
