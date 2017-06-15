

module.exports = (app, socket) => {

	socket.on('cache:symbol:list', async (data, cb: Function) => {
		try {
			cb(null, await app.controllers.cache.getSymbolList());
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});

	socket.on('cache:read', async (data, cb: Function) => {
		try {
			cb(null, app.controllers.cache.getSymbolList());
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});
};