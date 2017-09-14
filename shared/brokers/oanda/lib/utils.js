"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function rateLimit(fn, context, rate, warningThreshold) {
    let queue = [], timeout;
    function next() {
        if (queue.length === 0) {
            timeout = null;
            return;
        }
        fn.apply(context, queue.shift());
        timeout = setTimeout(next, rate);
    }
    return function () {
        if (!timeout) {
            timeout = setTimeout(next, rate);
            fn.apply(context, arguments);
            return;
        }
        queue.push(arguments);
        if (queue.length * rate > warningThreshold) {
            console.warn("[WARNING] Rate limited function call will be delayed by", ((queue.length * rate) / 1000).toFixed(3), "secs");
        }
    };
}
exports.rateLimit = rateLimit;
//# sourceMappingURL=utils.js.map