const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema(
{
	name: String,
	// array of Departments, e.g. lower division
	courses: [{type: Schema.Types.ObjectId, ref: 'Course'}]
});

module.exports = mongoose.model('Department', DepartmentSchema);
