import * as mongoose from 'mongoose';
import {User} from '../schemas/user';
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


};

// module.exports.randomFollowAndCopy().catch(console.error);
// module.exports.syncMainChannels().catch(console.error);