// UCI scraper class
// Code moved from files

const WebSocApi = require('websoc-api');
const fs = require("fs");
const path = require("path");

function departments() {
	let uciDepts = fs.readFileSync(path.resolve(__dirname, "uci-depts.txt"), "utf-8").split('\n');
	return uciDepts;
}

function levels() {
	return ["Lower Div", "Upper Div", "Graduate"];
}

function name() {
	return "UC Irvine";
}

function currentTerm() {
	return "2020 Winter";
}

function run(options) {
    const result = WebSocApi.callWebSocApi(options);
    return result;
}

module.exports = {departments, levels, name, currentTerm, run}