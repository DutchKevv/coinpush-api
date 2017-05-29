import * as path    from 'path';
import * as fs      from 'fs';
import * as mkdirp  from 'mkdirp';

const merge = require('deepmerge');

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

	private _configCurrentPath: string = path.join(this.options.path.config, 'tradejs.config.json');
	private _configDefaultPath: string = path.join(__dirname, '..', 'config', 'tradejs.config.default');

	constructor(protected options: IAppConfig,
				protected app) {
	}

	async init(): Promise<IAppConfig> {
		console.log('CONFIG CONFI CONFIG', this.options.path.config);

		// Ensure path to folder exists
		mkdirp.sync(this.options.path.config);

		let config = await this._load();

		// Make sure new config is stored on init
		await this.set(config);

		return this._config;
	}

	get(): IAppConfig {
		return this._config;
	}

	get config() {
		return this._config;
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

			let fileConfig = {}, config;

			delete require.cache[this._configCurrentPath];
			try {
				fileConfig = require(this._configCurrentPath);
			} catch (error) {}

			// Merge the new config with default config <- file config <- App instance config options
			config = merge(fileConfig, this.options || {});
			resolve(config);
		});
	}
}