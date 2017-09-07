"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const merge = require("deepmerge");
const BehaviorSubject_1 = require("rxjs/BehaviorSubject");
const Subject_1 = require("rxjs/Subject");
const lodash_1 = require("lodash");
class Base extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.initialized = false;
        this.changed$ = new Subject_1.Subject();
        this.options$ = new BehaviorSubject_1.BehaviorSubject({});
        this.subscription = [];
        this._options = {};
        this.__setInitialOptions(new.target, options);
    }
    static getObjectDiff(a, b) {
        return lodash_1.reduce(a, function (result, value, key) {
            return lodash_1.isEqual(value, b[key]) ?
                result : result.concat(key);
        }, []);
    }
    get options() {
        return this._options;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initialized = true;
        });
    }
    get(key) {
        return typeof key === 'undefined' ? this._options : this._options[key];
    }
    set(obj, triggerChange = true, triggerOptions = true) {
        let diff = lodash_1.omit(obj, (v, k) => { return this.options[k] === v; });
        this._options = merge(this._options, obj);
        if (Object.keys(diff).length) {
            if (triggerChange)
                this.changed$.next(diff);
            if (triggerOptions)
                this.options$.next(this._options);
        }
    }
    destroy() {
        this.subscription.forEach(subscription => subscription.unsubscribe());
    }
    onDestroy() {
        this.changed$.unsubscribe();
        this.options$.unsubscribe();
        this.subscription.forEach(subscription => {
            subscription.unsubscribe();
        });
    }
    __setInitialOptions(target, options) {
        do {
            if (target.DEFAULTS)
                Object.assign(this._options, JSON.parse(JSON.stringify(target.DEFAULTS)));
            target = target.__proto__;
        } while (target.__proto__);
        Object.assign(this._options, options);
        this.options$.next(this._options);
    }
}
Base.isWin = /^win/.test(process.platform);
Base.isElectron = process && (process.env.ELECTRON || process.versions['electron']);
Base.isNode = !!process;
exports.Base = Base;

//# sourceMappingURL=Base.js.map
