import {IBacktestSettings} from '../../../shared/interfaces/BacktestSettings';

module.exports = (app, socket) => {

	socket.on('backtest:create', async (data: IBacktestSettings, cb: Function) => {
		try {
			let backtest = await app.controllers.backtest.create(data);

			cb(null, backtest.model.options);

			backtest.on('status', status => {
				socket.emit('backtest:status', {
					id: backtest.model.options.id,
					status: status
				});
			});

			// backtest.on('finish', (report) => {
			// 	socket.emit('backtest:finish');
			// });

			socket.broadcast.emit('backtest-created', backtest.options);
		} catch (err) {
			console.log(err);
			cb(err);
		}
	});

	socket.on('backtest:run', async (data) => {
		app.controllers.backtest.run(data);
	});

	socket.on('backtest:pause', async (data, cb) => {

	});

	socket.on('backtest:destroy', async (data, cb) => {

	});
};