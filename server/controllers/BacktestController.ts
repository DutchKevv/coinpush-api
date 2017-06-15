import * as winston	from 'winston-color';
import App from '../app';
import {IBacktestSettings} from '../../shared/interfaces/BacktestSettings';
import {Base} from '../../shared/classes/Base';

export default class BacktestController extends Base {

	private _backtests: Array<any> = [];
	private _unique = 0;

	constructor(__options, protected app: App) {
		super(__options);
	}

	public async init() {}

	public async create(data: IBacktestSettings): Promise<any> {
		// winston.info(`Creating backtest`);
		//
		// data = {
		// 	id: this._unique++,
		// 	ea: data.ea,
		// 	startEquality: data.startEquality,
		// 	symbols: data.symbols.map(symbol => symbol.toUpperCase()),
		// 	timeFrame: data.timeFrame,
		// 	from: data.from,
		// 	until: data.until,
		// 	currency: data.currency,
		// 	leverage: data.leverage,
		// 	pips: data.pips,
		// 	autoRun: data.autoRun
		// };
		//
		// let backtest = new BackTest(data, this.app);
		// await backtest.init();
		//
		// this._backtests.push(backtest);
		//
		// if (data.autoRun) {
		// 	process.nextTick(() => {
		// 		this.run(backtest.model.get('id'));
		// 	});
		// }
		//
		// return backtest;
	}

	public run(id) {
		winston.info(`Running backtest with id: ${id}`);

		let backtest = this.getById(id);
		backtest.run();
	}

	public pause(id) {

	}

	public getById(id) {
		return this._backtests.find(backtest => backtest.model.get('id') === id);
	}

	public destroy(id) {

	}
}