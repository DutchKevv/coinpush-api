import {EventEmitter}   from 'events';
import * as merge       from 'deepmerge';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

export class Base extends EventEmitter {

	public static readonly isWin = /^win/.test(process.platform);
	public static readonly isElectron = process && (process.env.ELECTRON || process.versions['electron']);
	public static readonly isNode = !!process;

	public initialized = false;
	public changed$ = new BehaviorSubject({});

	public get options() {
		return this._options;
	}

	private _options: any = {};

	constructor(options?: any) {
		super();

		this.__setInitialOptions(new.target, options);
	}

	public async init(): Promise<any> {
		this.initialized = true;
	}

	public get(key?: string | number) {
		return typeof key === 'undefined' ? this._options : this._options[key];
	}

	public set(obj: any, triggerChange = true) {
		this._options = merge(this._options, obj);

		if (triggerChange)
			this.changed$.next(<any>obj);
	}

	private __setInitialOptions(target, options) {
		let defaults = {};

		do {
			if (target.DEFAULTS)
				Object.assign(defaults, target.DEFAULTS);

			target = target.__proto__;
		} while(target.__proto__);

		this._options = Object.assign(defaults, options);
	}
}
