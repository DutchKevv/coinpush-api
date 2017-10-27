import {Schema, model} from 'mongoose';
import {isEmail} from 'validator';

const StatusSchema = new Schema({
	lastSync: {
		type: Number,
		default: 0
	}
});

export const Status = model('Status', StatusSchema);