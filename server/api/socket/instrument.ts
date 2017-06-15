import App from '../../app';
import {InstrumentSettings} from '../../../shared/interfaces/InstrumentSettings';

module.exports = (app: App, socket) => {

	// Create
	socket.on('instrument:create', async (options: Array<InstrumentSettings>, cb: Function) => {

		try {
			let instruments = await app.controllers.instrument.create(options);

			cb(null, instruments.map(instrument => ({id: instrument.options.id})));

		} catch (error) {
			console.error(error);
			cb(error);
		}
	});

	// TODO: Move to cache API
	// Read bars
	socket.on('instrument:read', async (options, cb) => {
		console.log('options options', options);
		try {
			cb(null, await app.controllers.instrument.read(options.id, options.from, options.until, options.count, undefined, options.indicators))
		} catch (error) {
			console.error(error);
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

	// Read options (indicators etc)
	socket.on('instrument:get-options', async (options, cb) => {
		try {
			cb(null, await app.controllers.instrument.getIndicatorData(options));
		} catch (err) {
			console.log(err);
			cb(err);
		}
	});

	socket.on('instrument:chart-list', (options, cb) => {
		let instruments = app.controllers.instrument.instruments,
			list = [],
			instrument, key;

		for (key in instruments) {
			instrument = instruments[key];

			list.push({
				id: instrument.id,
				timeFrame: instrument.timeFrame,
				symbol: instrument.symbol,
				live: instrument.live
			});
		}

		cb(null, list);
	});

	socket.on('instrument:toggleTimeFrame', async (options, cb) => {
		try {
			cb(null, await app.controllers.instrument.toggleTimeFrame(options.id, options.timeFrame));
		} catch (error) {
			console.log(error);
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
			console.error(error);
			cb(error);
		}
	});
};