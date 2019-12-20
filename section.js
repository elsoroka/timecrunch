const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SectionSchema = new Schema(
{
	enrolled: Number,
    meetings: [Meeting]
	// array of Sections, e.g. lower division
	sections: [{type: Schema.Types.ObjectId, ref: 'Section'}]
});

module.exports = mongoose.model('Section', SectionSchema);
