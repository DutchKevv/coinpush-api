import {Schema, model} from 'mongoose';
import * as beautifyUnique from 'mongoose-beautiful-unique-validation';

const CompanySchema = new Schema({
	name: {
		type: String,
		required: true,
		trim: true
    },
    img: {
		type: String,
		required: true
	},
	removed: {
		type: Boolean
	}
}, {
	timestamps: true
});

CompanySchema.plugin(beautifyUnique);

export const Company = model('Company', CompanySchema);