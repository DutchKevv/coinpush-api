import * as mongoose from 'mongoose';

const config = require('../../../tradejs.config');

/**
 *  Database
 */
const db = mongoose.connection;
mongoose.Promise = global.Promise;
mongoose.connect(config.server.cache.connectionString);

console.log(mongoose.connection.db.listCollections);

db.on('open', function () {
    mongoose.connection.db.listCollections().forEach(async collection => {
        // console.log(collection)
        await db[collection.name].remove();
    });
});

