import * as path    from 'path';
import * as winston	from 'winston-color';
import Base         from '../classes/Base';

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
			let filePath = path.join(__dirname, '..', 'classes', 'broker-api', apiName, apiName),
				accountConfig = this.app.controllers.config.get().account,
				BrokerApi, connected;

			delete require.cache[path.resolve(filePath)];

			// Load the new BrokerApi
			BrokerApi = require(filePath).default;
			this._brokerApi = new BrokerApi(accountConfig);
			await this._brokerApi.init();

			if (await this._brokerApi.testConnection()) {
				await this.app.controllers.cache.updateSettings(accountConfig);
				await this.app.controllers.system.update({connected: true});

				this.connected = true;
				this.emit('connected');
			}
		} catch (error) {
			console.warn('Error creating broker API \n\n', error);
		}

		return this.connected;
	}

	public getAccounts(): Promise<Array<any>> {
		if (this._ready)
			return this._brokerApi.getAccounts();
	}

	async disconnect(): Promise<void> {
		this.connected = false;

		this.app.controllers.system.update({connected: false});

		if (this._brokerApi) {
			try {
				await this._brokerApi.destroy();
				this._brokerApi = null;
			} catch (error) {
				console.log(error);
			}
		}

		winston.info('Disconnected');

		this.emit('disconnected');
	}

	async getInstrumentList(): Promise<any> | null {
		winston.info('Loading instrument list');

		try {
			return await this._brokerApi.getInstruments();
		} catch (error) {
			return null;
		}
	}
}