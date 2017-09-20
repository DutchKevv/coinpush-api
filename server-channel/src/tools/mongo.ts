import * as mongoose from 'mongoose';
import {Channel} from '../schemas/channel';
import {CHANNEL_TYPE_MAIN} from '../../../shared/constants/constants';

const config = require('../../../tradejs.config');
const argv = require('minimist')(process.argv.slice(2));
const db = mongoose.connection;
const ObjectId = require('mongodb').ObjectID;

mongoose.Promise = global.Promise;
mongoose.connect(config.server.channel.connectionString);

// handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('DB connected');
});

module.exports = {

	async syncMainChannels() {

		const users = require('./users.json');

		const results = await Promise.all(users.map(user => {
			return Channel.update({
				user_id: mongoose.Types.ObjectId(user._id.$oid),
				type: CHANNEL_TYPE_MAIN
			}, {profileImg: user.profileImg});
			//
			// return Channel.findOneAndUpdate(
			// 	{
			// 		user_id: mongoose.Types.ObjectId(user._id.$oid),
			// 		type: CHANNEL_TYPE_MAIN
			// 	}, {
			// 		user_id: mongoose.Types.ObjectId(user._id.$oid),
			// 		name: user.username,
			// 		profileImg: user.profileImg
			// 	},
			// 	{
			// 		upsert: true,
			// 		new: true,
			// 		setDefaultsOnInsert: true
			// 	},
			// 	(err, res) => {
			// 		console.log('err', err);
			// 		console.log('res', res);
			// 		// Deal with the response data/error
			// 	});
		}));

		console.log(results);

		// await Channel.insertMany(users.map(user => ({
		// 	user_id: mongoose.Types.ObjectId(user._id.$oid),
		// 	name: user.username,
		// 	profileImg: user.profileImg
		// })));

		console.log('DONE!');
		process.exit(0);
	},

	async randomFollowAndCopy() {

		const users = require('./users.json');
		const docs = [];

		users.forEach(user => {
			docs.push({
				user_id: mongoose.Types.ObjectId(user._id.$oid),
				name: user.username
			});
		});

		const channels = await Channel.find();

		await Promise.all(channels.map(channel => {
			const user1 = users[Math.floor(Math.random() * users.length)];
			const user2 = users[Math.floor(Math.random() * users.length)];

			return Promise.all([
				channel.update({$push: {followers: user1._id.$oid}}),
				channel.update({$push: {copiers: user2._id.$oid}})
			]);
		}));

		console.log('DONE!');
		process.exit(0);
	},

	async setRandomProfileImg() {

	},
};

// module.exports.randomFollowAndCopy().catch(console.error);
module.exports.syncMainChannels().catch(console.error);