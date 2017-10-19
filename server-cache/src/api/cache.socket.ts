import {cacheController} from '../controllers/cache.controller'


module.exports = (socket) => {

	socket.on('read', async (params, cb: Function) => {
		try {
			cb(null, await cacheController.find(params));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});

	socket.on('symbol:list', async (params, cb: Function) => {
		try {
			cb(null, cacheController.symbols);
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});
};