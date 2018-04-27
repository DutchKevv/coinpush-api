// import { Context } from "vm";

export class MicroEvent {
    private _events: any = {};

    public on(event: string, fct: Function, scope?) {
        if (!this._events[event])
            this._events[event] = [];

        this._events[event].push([fct, scope]);
    }

    public once(event: string, fct: Function, scope?) {
        if (!this._events[event])
            this._events[event] = [];

        this._events[event].push([
            (...arg) => {
                fct.apply(scope || this, Array.prototype.slice.call(arg, 1));
                this.off(event, fct);
            },
            scope
        ]);
    }

    public off(event: string, fct: Function) {
        if (!this._events[event]) return;

        this._events[event].splice(this._events[event].findIndex(event => event[0] === fct), 1);
    }

    public emit(event, ...arg: Array<any>) {
        if (!this._events[event]) return;

        for (var i = 0; i < this._events[event].length; i++) {
            this._events[event][i][0].apply(this._events[event][i][1] || this, Array.prototype.slice.call(arguments, 1));
        }
    }
};