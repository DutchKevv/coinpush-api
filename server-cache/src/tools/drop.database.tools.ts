import * as mongoose from 'mongoose';
import { config } from 'coinpush/src/util/util-config';

/**
 *  Database
 */
const db = mongoose.connection;
mongoose.connect(config.server.cache.connectionString);

db.on('open', function () {
    (<any>mongoose.connection.db.listCollections()).forEach(async collection => {
        // console.log(collection)
        await db[collection.name].remove();
    });
});

