"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = NodeJS.EventEmitter;
class SyncModel extends EventEmitter {
    constructor(data = {}, url, _socket) {
        super();
        this.data = data;
        this.url = url;
        this._socket = _socket;
    }
    set(obj, triggerChange = true) {
        if (typeof obj !== 'object')
            return;
        Object.assign(this.data, obj);
        if (triggerChange)
            this.emit('changed');
        this.sync();
    }
    toJson() {
        return JSON.stringify(this.data);
    }
    sync() {
        this._socket.emit(this.url, this.data);
    }
}
exports.SyncModel = SyncModel;
//# sourceMappingURL=SyncModel.js.map