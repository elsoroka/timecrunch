const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema(
{
    _id: Schema.Types.ObjectId,
    university: String,
    division: String,  
    department: String,
    // The names of the fields follow what WebSoc and websoc-api calls these
	courseNumber: String, // e.g. "20A"
	courseTitle: String,
	// array of secctions with nested array of meetings
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
});

module.exports = mongoose.model('Course', CourseSchema);
