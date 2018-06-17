import { BehaviorSubject } from 'rxjs';
import { EventEmitter } from '@angular/core';

export class BaseModel {

	public options: any = {};

	public readonly changed$: EventEmitter<Array<string>> = new EventEmitter();
	public readonly options$ = new BehaviorSubject({});

	constructor(options?: any) {
		this.__setInitialOptions(new.target, options);
	}

	public async init(): Promise<void> { }

	public get(key?: string | number) {
		return this.options[key];
	}

	public set(obj: any, triggerOptions: boolean = false) {
		Object.assign(this.options, obj);

		if (triggerOptions) {
			this.options$.next(this.options);
		}
	}

	private __setInitialOptions(target, options) {
		do {
			if (target.DEFAULTS)
				Object.assign(this.options, JSON.parse(JSON.stringify(target.DEFAULTS)));

			target = target.__proto__;
		} while (target.__proto__);

		Object.assign(this.options, options);
		this.options$.next(this.options);
	}
}
