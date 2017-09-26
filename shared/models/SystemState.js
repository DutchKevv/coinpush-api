"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SystemState {
    constructor(fields) {
        this.booting = false;
        this.connected = false;
        this.state = null;
        this.code = null;
        this.message = '';
        this.workers = 0;
        this.cpu = 0;
        if (fields)
            Object.assign(this, fields);
    }
}
exports.SystemState = SystemState;
//# sourceMappingURL=SystemState.js.map