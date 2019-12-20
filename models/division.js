const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DivisionSchema = new Schema(
{
	_id: Schema.Types.ObjectId,  
	name: String,
	// mapping of department name to course_id 
	departments: {type: Map, of: Schema.Types.ObjectId}
});

module.exports = mongoose.model('Division', DivisionSchema);
