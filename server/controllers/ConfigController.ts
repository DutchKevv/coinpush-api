import * as path    from 'path';
import * as fs      from 'fs';

const
	debug = require('debug')('TradeJS:ConfigController'),
	merge = require('deepmerge');

interface IAppConfig {
	system?: {
		port?: number
		timezone?: string,
	};
	path?: {
		cache?: string,
		custom?: string,
		config?: string
	};
	account?: any;
}


export default class ConfigController {

	private _config: IAppConfig = {};

	private _configCurrentPath: string = path.join(this.opt.path.config, 'tradejs.config.json');
	private _configDefaultPath: string = path.join(this.opt.path.config, 'tradejs.config.default');

	constructor(protected opt: IAppConfig, protected app) {
	}

	async init(): Promise<IAppConfig> {
		let config = await this._load();

		// Make sure new config is stored on init
		await this.set(config);

		return this._config;
	}


	get(): IAppConfig {
		return this._config;
	}

	get config() {
		return this._config;;
	}

	set(settings: IAppConfig): Promise<IAppConfig> {
		return new Promise(async (resolve, reject) => {

			// Write to variable
			this._config = merge(this._config, settings);

			// Write to file
			fs.writeFile(this._configCurrentPath, JSON.stringify(this._config, null, 2), err => {
				if (err)
					return reject(err);

				resolve(this._config);
			});
		});
	}

	_load(): Promise<IAppConfig> {
		return new Promise((resolve) => {

			let defaultConfig = require(this._configDefaultPath),
				fileConfig = {}, config;

			fs.exists(this._configCurrentPath, (exists: boolean) => {
				if (exists) {
					fs.readFile(this._configCurrentPath, 'utf8', (err, data) => {
						if (err) throw err;

						try {
							fileConfig = JSON.parse(data);
							debug('loaded config from: ', this._configCurrentPath)
						} catch (error) {
							console.warn('config corrupted!', error);
						}
					});

				} else {
					debug('no existing config file found');
				}
			});

			// Merge the new config with default config <- file config <- App instance config options
			config = merge.all([defaultConfig, fileConfig, this.opt]);

			resolve(config);
		});
	}
}