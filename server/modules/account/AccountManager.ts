import {Base} from '../../../shared/classes/Base';

export default class AccountManager extends Base {

	private _equality = 10000;

	public get equality() {
		return this._equality;
	}

	public set equality(amount: number) {
		this._equality = amount;
	}

	constructor(__options) {
		super(__options);
	}

	async init() {
		this._equality = this.options.equality;
	}

	public addEquality(amount: number) {
		this._equality = parseFloat((this._equality + amount).toFixed(2));
	}
}