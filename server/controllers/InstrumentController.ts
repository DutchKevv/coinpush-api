import * as path    from 'path';
import * as _       from 'lodash';
import * as winston	from 'winston-color';
import WorkerHost   from '../classes/worker/WorkerHost';
import Base         from '../classes/Base';
import App 			from '../app';

const PATH_INSTRUMENT = path.join(__dirname, '../classes/instrument/Instrument');

export default class InstrumentController extends Base {

	public ready = false;

	private _unique = 0;
	private _instruments = {};

	constructor(opt, protected app: App) {
		super(opt);
	}

	async init() {
	}

	public get instruments() {
		return this._instruments;
	}

	public async create(instrument: string, timeFrame: string, live = true, filePath: string = PATH_INSTRUMENT, options = {}) {
		winston.info(`Creating instrument ${instrument}`);

		if (!instrument) {
			this.app.debug('error', 'InstrumentController:create - illegal instrument given');
			return Promise.reject('InstrumentController:create - illegal instrument given');
		}

		if (!timeFrame) {
			this.app.debug('error', 'InstrumentController:create - illegal timeFrame given');
			return Promise.reject('InstrumentController:create - illegal timeFrame given');
		}

		instrument = instrument.toUpperCase();
		timeFrame = timeFrame.toUpperCase();

		let id = `${instrument}_${++this._unique}`;

		let worker = new WorkerHost({
			ipc: this.app.ipc,
			id: id,
			path: filePath,
			classArguments: Object.assign(options, {
				instrument,
				timeFrame,
				live
			})
		});

		worker.on('stderr', error => {
			this.app.debug('error', error);
		});

		await worker.init();

		this._instruments[id] = {
			id: id,
			instrument: instrument,
			timeFrame: timeFrame,
			live: live,
			worker: worker
		};

		this.emit('created', this._instruments[id]);

		return this._instruments[id];
	}

	public read(id: string, from: number, until: number, count: number, bufferOnly?: boolean, indicators: any = false) {
		winston.info(`Reading instrument ${id}`);

		if (!this._instruments[id])
			return Promise.reject(`Reject: Instrument '${id}' does not exist`);

		return this.instruments[id].worker.send('read', {from, until, count, indicators, bufferOnly});
	}

	public toggleTimeFrame(id, timeFrame) {
		this.instruments[id].timeFrame = timeFrame;

		return this.instruments[id].worker.send('toggleTimeFrame', {
			timeFrame: timeFrame
		});
	}

	public async addIndicator(params) {
		let id, data;

		id = await this.instruments[params.id].worker.send('indicator:add', {
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
		if (!this._instruments[params.id])
			return Promise.reject(`Reject: Instrument '${params.id}' does not exist`);

		let returnData = this.instruments[params.id].worker.send('get-data', {
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

	public destroy(id: string): void {
		winston.info('destroying - ' + id)
		if (this._instruments[id]) {
			this._instruments[id].worker.kill();
			this._instruments[id] = null;
			delete this._instruments[id];

			this.app.debug('info', 'Destroyed ' + id);
		} else {
			this.app.debug('error', 'Destroy - Could not find instrument ' + id);
		}

	}

	public async destroyAll(): Promise<any> {
		return Promise.all(_.map(this._instruments, (instrument, id) => this.destroy(id)));
	}

	// public isReady() {
	//     if (
	//         this._instrumentList.length &&
	//     )
	// }
}