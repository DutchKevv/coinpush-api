import { cacheController } from '../controllers/cache.controller'

module.exports = (socket: any) => {

	socket.on('read', async (params, cb: Function) => {
		try {
			cb(null, await cacheController.find(params));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});
};