import App 					from '../app';
import {Base} 				from '../../shared/classes/Base';
import {AccountSettings} 	from '../../shared/interfaces/AccountSettings';
import {log} 				from '../../shared/logger';

export default class AccountController extends Base {

	private _accounts: Array<AccountSettings> = [];
	private _details: any = {
		equality: 0
	};

	public get equality() {
		if (this._accounts)
			return this._details.equality;
	}

	constructor(protected __options, protected app: App) {
		super(__options);
	}

	public async init() {
		await this._load();
	}

	public async update() {

	}

	public getEquality() {

	}

	public getAccount() {

	}

	private async _load() {
		try {
			this._accounts = await this.app.controllers.broker.broker.getAccounts();
		} catch (error) {
			log.error('AccountController', error);
		}
	}


}