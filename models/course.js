const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
{
    university: String,
    division: String,  
    department: String,
    // The names of the fields follow what WebSoc and websoc-api calls these
	courseNumber: String, // e.g. "20A"
	courseTitle: String,
	// array of sections with nested array of parsed meetings
	sections: 
    [{
        enrolled: Number,       // enrolled under this department
        meetings:
        [{
            bldg: String,
            timeIsTBA: Boolean, // if true, then times are not valid
            startTime: Number,  // minutes since 12am
            endTime: Number,    // minutes since 12am
            days: [Number]
        }]
    }]
}, {timestamps:{}}); // option timestamps automatically adds createdAt and updatedAt fields


/*
 * TODO: We should un-flatten this. For example:
 * a University is a list of Departments
 * a Department is a list of Levels
 * a Level is a list of Courses
 * This matches the query structure we have where a user selects
 * one or more Departments and optionally one or more Levels per department.
 *
 * const UniversitySchema = new Schema(
 * {
 *      departments:[
 *          Department,
 * })
 * const DepartmentSchema = new Schema(
 * {
 *      levels:[
 *          Level:[
 *              Course,
 *      ],
 * })
 * // Remove university, division, department frou Course
*/

module.exports = mongoose.model('Course', CourseSchema);
