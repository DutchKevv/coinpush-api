import {EventEmitter, Output} from '@angular/core';

export class BaseModel {

	@Output() public changed = new EventEmitter();

	public data = {};

	public set(obj, triggerChange = true) {
		Object.assign(this.data, obj);

		if (triggerChange)
			this.changed.next(obj);
	}

	public toJson() {
		return JSON.stringify(this.data);
	}

	public sync() {

	}
}