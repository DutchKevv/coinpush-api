import {Base} 		from '../classes/Base';

export class BaseModel extends Base {

	public async init() {
		await super.init();
	}

	public toJson() {
		return JSON.stringify(this.options);
	}

	public sync() {

	}
}