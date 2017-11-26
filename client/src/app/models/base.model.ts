import {EventEmitter}   from 'events';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} 		from 'rxjs/Subject';
import {isEqual, reduce, omitBy} 		from 'lodash';

const merge = require('deepmerge');

export class BaseModel extends EventEmitter {

	private _options: any = {};

	public initialized = false;
	public readonly changed$: Subject<any> = new Subject();
	public readonly options$ = new BehaviorSubject({});

	public static readonly isWin = /^win/.test(process.platform);
	public static readonly isElectron = process && (process.env.ELECTRON || process.versions['electron']);
	public static readonly isNode = !!process;
	public subscription = [];

	public static getObjectDiff(a, b): any {
		return reduce(a, function(result, value, key) {
			return isEqual(value, b[key]) ?
				result : result.concat(key);
		}, []);
	}

	public get options() {
		return this._options;
	}

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

	public set(obj: any, triggerChange = true, triggerOptions = true) {
		let diff = omitBy(obj, (v, k) => this.options[k] === v);

		this._options = Object.assign(this._options, obj);
		// this._options = merge(this._options, obj);

		if (Object.keys(diff).length) {

			if (triggerChange)
				this.changed$.next(diff);

			if (triggerOptions)
				this.options$.next(this._options);
		}
	}

	public destroy(...params: Array<any>) {
		this.subscription.forEach(subscription => subscription.unsubscribe());
	}

	public onDestroy() {
		this.changed$.unsubscribe();
		this.options$.unsubscribe();

		this.subscription.forEach(subscription => {
			subscription.unsubscribe();
		});
	}

	private __setInitialOptions(target, options) {
		do {
			if (target.DEFAULTS)
				Object.assign(this._options, JSON.parse(JSON.stringify(target.DEFAULTS)));

			target = target.__proto__;
		} while (target.__proto__);

		Object.assign(this._options, options);
		this.options$.next(this._options);
	}
}
