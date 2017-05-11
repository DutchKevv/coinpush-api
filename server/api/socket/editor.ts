import * as _debug  from 'debug';

const debug = _debug('TradeJS:Editor');

module.exports = (app, socket) => {

	socket.on('file:list', () => {
		socket.emit('file:list', null, app.controllers.editor.getDirectoryTree());
	});

	socket.on('file:load', async (data, cb) => {
		debug(`Loading ${data.path}`);

		if (!data || typeof data.path !== 'string')
			return cb('No path given');

		try {
			cb(null, await app.controllers.editor.load(data.path));
		} catch (error) {
			cb(error);
		}
	});

	socket.on('file:save', async (data, cb) => {
		debug(`Saving ${data.path}`);

		if (!data || typeof data.path !== 'string')
			return cb('No path given');

		try {
			cb(null, await app.controllers.editor.save(data.path, data.content));
		} catch (error) {
			cb(error);
		}
	});

	socket.on('editor:file:delete', async (data, cb) => {
		debug(`Saving ${data.filePath}`);

		if (!data || typeof data.filePath !== 'string')
			return cb('No path given');

		try {
			cb(null, await app.controllers.editor.delete(data.filePath));
		} catch (error) {
			cb(error);
		}
	});


	socket.on('editor:file:rename', async (data, cb) => {
		debug(`Saving ${data.filePath}`);

		if (!data || typeof data.filePath !== 'string')
			return cb('No filePath given');

		try {
			cb(null, await app.controllers.editor.rename(data.filePath, data.name));
		} catch (error) {
			cb(error);
		}
	});

	socket.on('editor:file:create', async (data, cb) => {
		debug(`Saving ${data.filePath}`);


	});

	socket.on('editor:directory:create', async (data, cb) => {
		debug(`Saving ${data.filePath}`);

		if (!data || typeof data.filePath !== 'string')
			return cb('No filePath given');

		try {
			cb(null, await app.controllers.editor.rename(data.filePath, data.name));
		} catch (error) {
			cb(error);
		}
	});
};
