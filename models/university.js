const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UniversitySchema = new Schema(
{
	_id: Schema.Types.ObjectId,  
	name: String,
	// array of Divisions, e.g. lower division
	// map of division_name to division_id
	divisions: [{type: Schema.Types.ObjectId, ref: 'Division'}]
});

module.exports = mongoose.model('University', UniversitySchema);

