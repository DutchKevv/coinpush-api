"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var util_log_1 = require("../util/util.log");
var index_1 = require("./oanda/index");
var cryptocompare_broker_1 = require("./cc/cryptocompare.broker");
var constant_1 = require("../constant");
var config = require('../../../../tradejs.config');
var BrokerMiddleware = /** @class */ (function (_super) {
    __extends(BrokerMiddleware, _super);
    function BrokerMiddleware() {
        var _this = _super.call(this) || this;
        _this._symbols = [];
        _this._brokers = {
            oanda: null,
            cc: null
        };
        _this._installBrokerOanda();
        _this._installBrokerCC();
        return _this;
    }
    Object.defineProperty(BrokerMiddleware.prototype, "symbols", {
        get: function () {
            return this._symbols;
        },
        enumerable: true,
        configurable: true
    });
    BrokerMiddleware.prototype.getSymbols = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, sorted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([this._brokers.oanda.getSymbols(), this._brokers.cc.getSymbols()])];
                    case 1:
                        results = _a.sent();
                        sorted = [].concat.apply([], results).sort(function (a, b) {
                            return a.displayName.localeCompare(b.displayName);
                        });
                        // add marker placeholders (Hour / Day)
                        sorted.forEach(function (symbol) {
                            symbol.marks = {
                                H: undefined,
                                D: undefined
                            };
                        });
                        return [2 /*return*/, sorted];
                }
            });
        });
    };
    BrokerMiddleware.prototype.setSymbols = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.getSymbols()];
                    case 1:
                        _a._symbols = _b.sent();
                        // this._symbols = [this._symbols[0]];
                        // remove img url (only needed when building spritesheet in client)
                        this.symbols.forEach(function (symbol) {
                            delete symbol.img;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    BrokerMiddleware.prototype.setLastKnownPrices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var prices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCurrentPrices(this.symbols.map(function (symbol) { return symbol.name; }))];
                    case 1:
                        prices = _a.sent();
                        prices.forEach(function (priceObj) {
                            var symbol = _this.symbols.find(function (symbol) { return symbol.name === priceObj.instrument; });
                            if (symbol)
                                symbol.bid = priceObj.bid;
                            else
                                console.warn('symbol not found for priceObj: ' + priceObj);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    BrokerMiddleware.prototype.getCurrentPrices = function (symbols) {
        return __awaiter(this, void 0, void 0, function () {
            var brokers, pList, result, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        brokers = this.splitSymbolsToBrokers(symbols);
                        pList = [];
                        if (brokers.oanda.length)
                            pList.push(this._brokers.oanda.getCurrentPrices(brokers.oanda));
                        if (brokers.cc.length)
                            pList.push(this._brokers.cc.getCurrentPrices(brokers.cc));
                        _b = (_a = [].concat).apply;
                        _c = [[]];
                        return [4 /*yield*/, Promise.all(pList)];
                    case 1:
                        result = _b.apply(_a, _c.concat([(_d.sent())]));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    BrokerMiddleware.prototype.getCandles = function (symbolName, from, until, timeFrame, count, onData) {
        var symbol = this.symbols.find(function (symbol) { return symbol.name === symbolName; });
        if (!symbol) {
            console.warn('Unkown symbol: ' + symbolName);
            return Promise.resolve([]);
        }
        if (symbol.broker === constant_1.BROKER_GENERAL_TYPE_CC)
            return this._brokers.cc.getCandles(symbolName, timeFrame, from, until, count, onData);
        if (symbol.broker === constant_1.BROKER_GENERAL_TYPE_OANDA)
            return this._brokers.oanda.getCandles(symbolName, timeFrame, from, until, count, onData);
        throw new Error('UNKOWN BROKER: ' + JSON.stringify(symbol, null, 2));
    };
    BrokerMiddleware.prototype.openTickStream = function (symbols, brokerNames) {
        var _this = this;
        if (symbols === void 0) { symbols = this.symbols; }
        if (brokerNames === void 0) { brokerNames = []; }
        var brokers = this.splitSymbolsToBrokers(symbols);
        if (!brokerNames.length || brokerNames.indexOf('oanda') > -1) {
            this._brokers.oanda.on('tick', function (tick) { return _this.emit('tick', tick); });
            this._brokers.oanda.subscribePriceStream(brokers.oanda);
            util_log_1.log.info('Cache', 'oanda tick streams active');
        }
        if (!brokerNames.length || brokerNames.indexOf('cc') > -1) {
            this._brokers.cc.on('tick', function (tick) { return _this.emit('tick', tick); });
            this._brokers.cc.subscribePriceStream(brokers.cc);
            util_log_1.log.info('Cache', 'cryptocompare tick streams active');
        }
    };
    BrokerMiddleware.prototype.splitSymbolsToBrokers = function (symbols) {
        var _this = this;
        var oanda = [];
        var cc = [];
        symbols.forEach(function (symbol) {
            var symbolObj = _this.symbols.find(function (s) { return s.name === symbol; });
            if (!symbolObj)
                return;
            if (symbolObj.broker === constant_1.BROKER_GENERAL_TYPE_CC)
                cc.push(symbol);
            else
                oanda.push(symbol);
        });
        return {
            oanda: oanda,
            cc: cc
        };
    };
    BrokerMiddleware.prototype._installBrokerOanda = function () {
        var _this = this;
        if (this._brokers.oanda) {
            try {
                this._brokers.oanda.destroy();
            }
            catch (error) {
                console.error(error);
            }
        }
        this._brokers.oanda = new index_1.OandaApi(config.broker.oanda);
        // handle tick stream timeout (the used oanda file does not reconnect for some reason)
        this._brokers.oanda.once('stream-timeout', function () {
            _this._installBrokerOanda();
            _this.openTickStream(_this.symbols, ['oanda']);
        });
        this._brokers.oanda.init();
    };
    BrokerMiddleware.prototype._installBrokerCC = function () {
        this._brokers.cc = new cryptocompare_broker_1.default({});
    };
    BrokerMiddleware.prototype.destroy = function () {
    };
    return BrokerMiddleware;
}(events_1.EventEmitter));
exports.BrokerMiddleware = BrokerMiddleware;
//# sourceMappingURL=broker.middleware.js.map