import * as path    from 'path';
import {log} 		from '../../shared/logger';
import {Base} 		from '../../shared/classes/Base';

const
	DEFAULT_PATH_BROKERS = path.join(__dirname, '..', '..', 'shared', 'brokers');

export default class BrokerController extends Base {

	public get broker() {
		return this._broker;
	}

	private _broker: any;

	constructor(protected __options, protected app) {
		super(__options);
	}

	public async loadBrokerApi(apiName: string): Promise<boolean> {
		await this.disconnect();

		try {
			let filePath = path.join(DEFAULT_PATH_BROKERS, apiName, 'index'),
				accountConfig = this.app.controllers.config.get().account,
				BrokerApi, connected;

			// Clean up node cached version
			delete require.cache[path.resolve(filePath)];
			BrokerApi = require(filePath).default;

			this._broker = new BrokerApi(accountConfig);
			this._broker.on('error', error => log.error('BrokerController', error));

			await this._broker.init();

			await Promise.all([
				this._broker.testConnection(),
				this.app.controllers.cache.updateBrokerSettings(accountConfig)
			]);

			this.app.controllers.system.update({connected: true});

			return true;
		} catch (error) {
			log.error('BrokerController', error);
			await this.disconnect();
			return false;
		}
	}

	async disconnect(): Promise<void> {
		this.app.controllers.system.update({connected: false});

		if (this._broker) {
			try {
				await Promise.all([this._broker.destroy(), this.app.controllers.cache.updateBrokerSettings({})]);
			} catch (error) {
				log.error('BrokerController', error);
			}

			this._broker = null;
		}

		log.info('BrokerController', 'Disconnected');
	}
}