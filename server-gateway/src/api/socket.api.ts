import {cacheController} from '../controllers/cache.controller'
import { app } from '../app';

module.exports = (socket) => {
    console.log('connect!');
	socket.on('read', async (params, cb: Function) => {
		try {
			cb(null, await cacheController.find({id: null}, params));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});
};