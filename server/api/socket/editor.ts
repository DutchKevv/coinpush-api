import * as _debug  from 'debug';

const debug = _debug('TradeJS:Editor');

module.exports = (app, socket) => {

	socket.on('file:list', async () => {
		socket.emit('file:list', null, await app.controllers.editor.directoryTree);
	});

	socket.on('file:load', async (data, cb) => {
		try {
			cb(null, await app.controllers.editor.loadFile(data.id));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});

	socket.on('file:save', async (data, cb) => {
		if (!data || typeof data.path !== 'string')
			return cb('No path given');

		try {
			cb(null, await app.controllers.editor.save(data.path, data.content));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});

	socket.on('editor:file:delete', async (data, cb) => {
		if (!data || typeof data.filePath !== 'string')
			return cb('No path given');

		try {
			cb(null, await app.controllers.editor.delete(data.filePath));
		} catch (error) {
			console.error(error);
			cb(error);
		}
	});


	socket.on('editor:rename', async (data, cb) => {
		try {
			cb(null, await app.controllers.editor.rename(data.id, data.name));
		} catch (error) {
			console.error('error');
			cb(error);
		}
	});

	socket.on('editor:file:create', async (data, cb) => {
		try {
			cb(null, await app.controllers.editor.createFile(data.parent, data.name));
		} catch (error) {
			console.error('error');
			cb(error);
		}
	});

	socket.on('editor:directory:create', async (data, cb) => {
		try {
			cb(null, await app.controllers.editor.createDirectory(data.parent, data.name));
		} catch (error) {
			console.error('error');
			cb(error);
		}
	});
};
