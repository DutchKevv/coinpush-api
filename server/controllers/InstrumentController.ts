import * as path    		from 'path';
import App 					from '../app';
import WorkerHost   		from '../classes/worker/WorkerHost';
import {log} 				from '../../shared/logger';
import {Base} 				from '../../shared/classes/Base';
import {InstrumentModel} 	from '../../shared/models/InstrumentModel';

const PATH_INSTRUMENT = path.join(__dirname, '..', 'classes', 'instrument', 'Instrument');

export default class InstrumentController extends Base {

	public get instruments() {
		return this._instruments;
	}

	private _unique: number = 0;
	private _instruments: Array<any> = [];
	private _workers: Array<WorkerHost> = [];

	constructor(protected __options, protected app: App) {
		super(__options);
	}

	public async init() {
		this.app.ipc.on('instrument:status', data => this._updateInstrumentStatus(data.id, data));
	}

	public async create(instruments: Array<any>): Promise<Array<any>> {
		let groupId = ++this._unique;

		return Promise.all(instruments.map(async options => {
			log.info('InstrumentController', `Creating instrument ${options.symbol}`);

			if (!options.symbol) {
				this.app.debug('error', 'InstrumentController:create - illegal or no symbol name given');
				return Promise.reject('InstrumentController:create - illegal or no symbol name given');
			}

			options.id = `${options.symbol}_${++this._unique}`;
			options.groupId = groupId;

			let workerPath = PATH_INSTRUMENT,
				model, worker;

			if (options.ea)
				workerPath = path.join(this.app.controllers.config.config.path.custom, 'ea', options.ea, 'index');

			model = new InstrumentModel(options);

			worker = new WorkerHost({
				ipc: this.app.ipc,
				id: options.id,
				path: workerPath,
				classArguments: options
			});

			worker.on('error', error => {
				this.app.debug('error', error);
			});

			worker.once('exit', code => {
				if (this.getById(options.id))
					this.destroy(options.id);
			});

			this._instruments.push({
				model: model,
				worker: worker
			});

			await worker.init();

			this.emit('created', model);

			return model
		}));
	}

	public read(id: string, from: number, until: number, count: number, bufferOnly?: boolean, indicators: any = false) {
		let instrument = this.getById(id);

		if (!instrument)
			return Promise.reject(`Instrument '${id}' does not exist`);

		return instrument.worker.send('read', {from, until, count, indicators, bufferOnly});
	}

	public getList() {
		return this._instruments.map(instrument => {
			let options = instrument.model.options;

			return {
				id: options.id,
				from: options.from,
				until: options.until,
				groupId: options.groupId,
				symbol: options.symbol,
				timeFrame: options.timeFrame,
				type: options.type,
				orders: options.type === 'backtest' ? options.orders : [],
				status: options.status,
				startEquality: options.startEquality
			}
		});
	}

	public toggleTimeFrame(id, timeFrame) {
		this.instruments[id].timeFrame = timeFrame;

		return this.instruments[id].worker.send('toggleTimeFrame', {
			timeFrame: timeFrame
		});
	}

	public async addIndicator(params) {
		let instrument = this.getById(params.id),
			id, data;

		if (!instrument)
			return Promise.reject(`Reject: Instrument '${params.id}' does not exist`);

		id = await instrument.worker.send('indicator:add', {
			name: params.name,
			options: params.options
		});

		if (params.readCount) {
			data = await this.getIndicatorData({
				id: params.id,
				indicatorId: id,
				name: params.name,
				count: params.readCount
			});
		}

		return {id, data};
	}

	public getIndicatorData(params) {
		let instrument = this.getById(params.id);

		if (!instrument)
			return Promise.reject(`Reject: Instrument '${params.id}' does not exist`);

		let returnData = instrument.worker.send('get-data', {
			indicatorId: params.indicatorId,
			name: params.name,
			from: params.from,
			until: params.until,
			count: params.count
		});

		// console.log(returnData);

		return returnData
	}

	public async getIndicatorOptions(params) {

		return new Promise((resolve, reject) => {

			const PATH_INDICATORS = path.join(__dirname, '../../shared/indicators');

			let configPath = `${PATH_INDICATORS}/${params.name}/config.json`;

			resolve(require(configPath));
		});
	}

	public getById(id: string) {
		return this._instruments.find(instrument => instrument.model.options.id === id);
	}

	public findIndexById(id: string): number {
		return this._instruments.findIndex(instrument => instrument.model.options.id === id);
	}

	public destroy(id: string): void {
		log.info('InstrumentController', 'destroying ' + id);

		let instrument = this.getById(id);

		if (!instrument)
			return console.warn(`Destroy: No such instrument ${id}`);

		this._instruments.splice(this.findIndexById(id), 1);

		instrument.worker.kill();

		this.app.debug('info', 'Destroyed ' + id);
	}

	public destroyAll(): void {
		this._instruments.forEach(instrument => this.destroy(instrument.model.options.id));
	}

	private _updateInstrumentStatus(id, data): void {
		let instrument = this.getById(id);

		if (!instrument) {
			log.warn('InstrumentController', `Received instrument update from unknown worker ${id}`);
			return;
		}


		instrument.model.set(data);

		this.emit('instrument:status', data);
	}

	// public isReady() {
	//     if (
	//         this._instrumentList.length &&
	//     )
	// }
}