import * as path        from 'path';
import InstrumentCache  from './InstrumentCache';
import {log} 			from '../../../shared/logger';
import OrderManager    	from '../../modules/order/OrderManager';

const PATH_INDICATORS = path.join(__dirname, '../../../shared/indicators');

export default class Instrument extends InstrumentCache {

	public orderManager: OrderManager;

	private _unique = 0;

	indicators = [];

	async init() {
		await super.init();
		await this._setIPCEvents();

		await this.loadTemplate('default');
	}

	async tick(timestamp, bid, ask): Promise<void> {
		this.indicators.forEach(i => i.onTick(bid, ask));
	}

	toggleTimeFrame(timeFrame: string) {
		this.timeFrame = timeFrame;

		return this.reset();
	}

	async loadTemplate(template: string) {

	}

	addIndicator(name, options): any {
		log.info('Instrument', 'add indicator: ' + name);

		let indicator = null,
			id = null;

		options.name = name;

		try {
			id = name + '_' + ++this._unique;
			let indicatorPath = path.join(PATH_INDICATORS, name, 'index.js');
			indicator = new (require(indicatorPath).default)(this.ticks, options);
			indicator.id = id;
			this.indicators.push(indicator);

			indicator._doCatchUp();
		} catch (err) {
			console.log('Could not add indicator', err);
		}

		return indicator;
	}

	removeIndicator(id) {
		log.info('Instrument', 'remove indicator: ' + id);
		this.indicators.splice(this.indicators.findIndex(indicator => indicator.id === id), 1);
	}

	removeAllIndicators() {
		log.info('Instrument', 'removing all indicator');
		this.indicators = [];
	}

	getIndicatorData(id: string, count?: number, offset?: number, from?: number, until?: number) {
		let _indicator = this.indicators.find(indicator => indicator.id === id);

		if (!_indicator) {
			throw new Error(`Indicator [${id}] does not exists`);
		}

		return _indicator.getDrawBuffersData(count, offset, from, until);
	}

	getIndicatorsData(params: {count: number, offset: number, from: number, until: number}) {
		return this.indicators.map(indicator => {
			return {
				id: indicator.id,
				buffers: this.getIndicatorData(indicator.id, params.count, params.offset, params.from, params.until)
			}
		});
	}

	async _setIPCEvents() {
		this.ipc.on('read', async (params: any, cb: Function) => {
			try {
				cb(null, {
					indicators: await this.getIndicatorsData(params)
				});

				// TODO: Separate calls for orders & indicators (indicators can be read separate from orders, when you added a new one for example)
				//
				// if (this.orderManager && returnObj.candles.length) {
				// 	returnObj.orders = await this.orderManager.findByDateRange(
				// 		returnObj.candles[0][0],
				// 		returnObj.candles[returnObj.candles.length - 1][0]
				// 	);
				// } else {
				// 	returnObj.orders = [];
				// }
			} catch (error) {
				// console.log('Error:', error);
				cb(error);
			}
		});

		this.ipc.on('indicator:add', async (data: any, cb: Function) => {
			try {
				cb(null, (await this.addIndicator(data.name, data.options)).id);
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});

		this.ipc.on('indicator:remove', async (data: any, cb: Function) => {
			try {
				cb(null, (await this.addIndicator(data.name, data.options)).id);
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});

		this.ipc.on('toggleTimeFrame', async (data: any, cb: Function) => {
			try {
				cb(null, await this.toggleTimeFrame(data.timeFrame));
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});
	}

	async reset(keepIndicators = true) {
		let indicators = [];

		for (let id in this.indicators) {
			indicators.push(this.indicators[id].options);
		}

		this.removeAllIndicators();

		await super.reset();

		for (let i = 0; i < indicators.length; ++i) {
			this.addIndicator(indicators[i].name, indicators[i]);
		}
	}
}