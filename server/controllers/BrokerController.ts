import * as path    from 'path';
import Base         from '../classes/Base';

const debug = require('debug')('TradeJS:BrokerController');

export default class BrokerController extends Base {

	public connected = false;
	public broker = 'oanda';

	private _ready = false;
	private _brokerApi: any;

	constructor(protected opt, protected app) {
		super(opt);
	}

	public async init(): Promise<void> {}

	public async loadBrokerApi(apiName: string): Promise<boolean> {
		await this.disconnect();


		try {

			// Clean up node cached version
			let filePath = path.join(__dirname, '..', 'classes', 'broker-api', apiName, apiName);
			delete require.cache[path.resolve(filePath)];

			// Load the new BrokerApi
			let BrokerApi = require(filePath).default;
			this._brokerApi = new BrokerApi(this.app.controllers.config.get().account);
			await this._brokerApi.init();

			this.connected = await this._brokerApi.testConnection();

			if (this.connected) {
				await this.app.controllers.system.update({connected: true});
				this.emit('connected');
			}
		} catch (error) {
			console.warn('Error creating broker API \n\n', error);
			await this.app.controllers.system.update({connected: true});
			this.connected = false;
		}

		return this.connected;
	}

	public getAccounts(): Promise<Array<any>> {
		if (this._ready)
			return this._brokerApi.getAccounts();
	}

	async disconnect(): Promise<void> {
		await this.app.controllers.system.update({connected: false});

		if (this._brokerApi) {
			try {
				await Promise.all([this._brokerApi.destroy(), this.app.controllers.cache.updateSettings({})]);
				await this._brokerApi.destroy();
				this._brokerApi = null;
			} catch (error) {
				console.log(error);
			}
		}

		debug('Disconnected');

		this.emit('disconnected');
	}

	async getInstrumentList(): Promise<any> | null {
		debug('Loading instrument list');

		try {
			return await this._brokerApi.getInstruments();
		} catch (error) {
			return null;
		}
	}
}