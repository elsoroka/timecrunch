const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UniversitySchema = new Schema({
    name: String,
    departments: [String],
    divisions: [String],
    courses: [{type: Schema.ObjectId, ref: "Course"}]
},
{timestamps: true});

module.exports = mongoose.model('University', UniversitySchema)
