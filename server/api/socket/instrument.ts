import App from '../../app';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';
import {log}        		from '../../../shared/logger';

module.exports = (app: App, socket) => {

	// Create
	socket.on('instrument:create', async (options: Array<InstrumentSettings>, cb: Function) => {
		try {
			let instruments = await app.controllers.instrument.create(options);
			cb(null, instruments.map(instrument => instrument.options));
		} catch (error) {
			log.error('InstrumentAPI', error);
			cb(error);
		}
	});

	// Read indicators
	socket.on('instrument:read', async (options, cb) => {
		try {
			cb(null, await app.controllers.instrument.read(options));
		} catch (error) {
			log.error('InstrumentAPI', error);
			cb(error);
		}
	});

	// Destroy
	socket.on('instrument:destroy', (options, cb) => {
		app.controllers.instrument.destroy(options.id);
		cb(null);
	});

	// Destroy All
	socket.on('instrument:destroy-all', async (options, cb) => {
		cb(null, await app.controllers.instrument.destroyAll());
	});

	socket.on('instrument:list', (options, cb) => {
		cb(null, app.controllers.instrument.getList());
	});

	socket.on('instrument:toggleTimeFrame', async (options, cb) => {
		try {
			cb(null, await app.controllers.instrument.toggleTimeFrame(options.id, options.timeFrame));
		} catch (error) {
			console.error('ERROR', error);
			cb(error);
		}
	});

	socket.on('instrument:indicator:options', async (options, cb) => {
		cb(null, await app.controllers.instrument.getIndicatorOptions(options));
	});

	socket.on('instrument:indicator:add', async (options, cb) => {
		try {
			cb(null, await app.controllers.instrument.addIndicator(options));
		} catch (error) {
			console.error('ERROR', error);
			cb(error);
		}
	});
};