import * as mongoose from 'mongoose';
import {Channel} from '../schemas/channel';

const config = require('../../../tradejs.config');
const argv = require('minimist')(process.argv.slice(2));
const db = mongoose.connection;

mongoose.Promise = global.Promise;
mongoose.connect(config.server.channel.connectionString);

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB connected');
});

module.exports = {

	async syncMainChannels() {

		// const users = require('./users.json');
		// const docs = [];
		//
		// users.forEach(user => {
		// 	docs.push({
		// 		user_id:  mongoose.Types.ObjectId(user._id.$oid),
		// 		name: 'personal'
		// 	});
		// });
		//
		// await Channel.insertMany(docs);
		// console.log('DONE!');
		// process.exit(0);
	}
};

module.exports.syncMainChannels().catch(console.error);