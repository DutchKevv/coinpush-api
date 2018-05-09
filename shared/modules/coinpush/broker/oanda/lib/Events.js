"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Waits for wait ms for event to fire or calls listener with error, removing listener
function waitFor(event, listener, context, wait) {
    var timeout;
    if (!wait) {
        throw new Error("[FATAL] waitFor called without wait time");
    }
    var handler = function () {
        clearTimeout(timeout);
        listener.apply(context, arguments);
    };
    timeout = setTimeout(function () {
        this.removeListener(event, handler, context);
        listener.call(context, "timeout");
    }.bind(this), wait);
    this.once(event, handler, context);
}
// Listens for duration ms for events to fire, then removes listener
function listenFor(event, listener, context, duration) {
    setTimeout(function () {
        this.removeListener(event, listener, context);
    }.bind(this), duration);
    this.on(event, listener, context);
}
// Returns list off event handlers using same matching criteria as 'off' (excluding eventsAPI features)
function getHandlers(name, callback, context) {
    var events = [];
    if (!callback && !context) {
        if (name) {
            return (this._events && this._events[name]) || [];
        }
        else {
            return this._events;
        }
    }
    this._events.forEach(function (value, key) {
        if (!name || key === name) {
            value.forEach(function (event) {
                if ((!callback || event.callback === callback) && (!context || event.context === context)) {
                    events.push(event);
                }
            });
        }
    });
    return events;
}
function mixin(proto) {
    // Mixin origin BackboneEvent methods
    // Events.mixin(proto);
    // Add some compatibility with node's EventEmitter.
    // proto.addListener = Events.on;
    // proto.emit = Events.trigger;
    // proto.removeListener = Events.removeAllListeners = Events.off;
    // Add in our custom methods
    proto.waitFor = waitFor;
    proto.listenFor = listenFor;
    proto.getHandlers = getHandlers;
    return proto;
}
exports.mixin = mixin;
//# sourceMappingURL=Events.js.map