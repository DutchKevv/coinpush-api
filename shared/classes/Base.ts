import {EventEmitter}   from 'events';
import * as merge       from 'deepmerge';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} 		from 'rxjs/Subject';

export class Base extends EventEmitter {

	public static readonly isWin = /^win/.test(process.platform);
	public static readonly isElectron = process && (process.env.ELECTRON || process.versions['electron']);
	public static readonly isNode = !!process;

	public initialized = false;
	public readonly changed$ = new Subject();
	public readonly options$ = new BehaviorSubject({});

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

		this.options$.next(this._options);
	}

	public onDestroy() {
		this.changed$.unsubscribe();
		this.options$.unsubscribe();
	}

	private _updateRecursive(obj) {


	}

	private __setInitialOptions(target, options) {
		do {
			if (target.DEFAULTS)
				Object.assign(this._options, JSON.parse(JSON.stringify(target.DEFAULTS)));

			target = target.__proto__;
		} while(target.__proto__);

		Object.assign(this._options, options);
		this.options$.next(this._options);
	}
}
