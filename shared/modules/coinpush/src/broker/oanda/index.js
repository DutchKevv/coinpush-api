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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var OANDAAdapter_1 = require("./lib/OANDAAdapter");
var util_date_1 = require("../../util/util.date");
var events_1 = require("events");
var constants_1 = require("../../constant/constants");
var metaData = require('./symbols-meta').meta;
var OandaApi = /** @class */ (function (_super) {
    __extends(OandaApi, _super);
    function OandaApi(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        _this._client = null;
        _this._priceStreamSymbols = [];
        return _this;
    }
    OandaApi.prototype.init = function () {
        var _this = this;
        this._client = new OANDAAdapter_1.OandaAdapter({
            // 'live', 'practice' or 'sandbox'
            environment: this.options.environment,
            // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
            accessToken: this.options.token,
            // Optional. Required only if environment is 'sandbox'
            username: this.options.username
        });
        this._client.on('stream-timeout', function () {
            try {
                _this.unsubscribePriceStream();
                _this.subscribePriceStream();
            }
            catch (error) {
                console.log(error);
            }
        });
    };
    OandaApi.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAccounts()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OandaApi.prototype.getAccounts = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.getAccounts(function (err, accounts) {
                if (err)
                    return reject(err);
                resolve(accounts);
            });
        });
    };
    OandaApi.prototype.getTransactionHistory = function (minId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.getTransactionHistory(_this.options.accountId, minId, function (err, transactions) {
                if (err)
                    return reject(err);
                resolve(transactions.reverse());
            });
        });
    };
    OandaApi.prototype.getOpenOrders = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.getOpenTrades(_this.options.accountId, function (err, orders) {
                if (err)
                    return reject(err);
                resolve(orders);
            });
        });
    };
    OandaApi.prototype.subscribeEventStream = function (callback) {
        this._client.subscribeEvents(function (event) { return callback(event); });
    };
    OandaApi.prototype.unsubscribeEventStream = function (listener) {
        this._client.unsubscribeEvents(listener);
    };
    OandaApi.prototype.subscribePriceStream = function (symbols) {
        var _this = this;
        if (symbols) {
            this._priceStreamSymbols = symbols.map(function (symbol) { return symbol.name; });
        }
        this._client.subscribePrices(this.options.accountId, this._priceStreamSymbols, function (tick) { return _this._onPriceUpdateCallback(tick); });
    };
    OandaApi.prototype.unsubscribePriceStream = function () {
        this._client.unsubscribePrices(this.options.accountId, this._priceStreamSymbols);
    };
    OandaApi.prototype.getSymbols = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.getInstruments(_this.options.accountId, function (err, symbols) {
                if (err)
                    return reject(err);
                var normalized = symbols.map(function (symbol) {
                    var meta = metaData.find(function (m) { return m.name === symbol.instrument; });
                    return {
                        precision: -Math.floor(Math.log(symbol.precision) / Math.log(10) + 1),
                        img: '/image/default/symbol/spx500-70x70.png',
                        name: symbol.instrument,
                        displayName: symbol.displayName,
                        broker: constants_1.BROKER_GENERAL_TYPE_OANDA,
                        type: meta ? meta.type : constants_1.SYMBOL_CAT_TYPE_OTHER
                    };
                });
                resolve(normalized);
            });
        });
    };
    /**
     *
     * @param symbol
     * @param timeFrame
     * @param from
     * @param until
     * @param count
     * @param onData
     */
    OandaApi.prototype.getCandles = function (symbol, timeFrame, from, until, count, onData) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, writeChunks, finished, _loop_1, i, len;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!count && !until)
                            until = Date.now();
                        chunks = util_date_1.splitToChunks(timeFrame, from, until, count, OandaApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0;
                        if (!chunks.length)
                            return [2 /*return*/];
                        _loop_1 = function (i, len) {
                            var chunk;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        chunk = chunks[i];
                                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                _this._client.getCandles(symbol, chunk.from, chunk.until, timeFrame, chunk.count, function (error, data) { return __awaiter(_this, void 0, void 0, function () {
                                                    var candles_1;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                if (error)
                                                                    return [2 /*return*/, console.error(error)];
                                                                if (!(data.candles && data.candles.length)) return [3 /*break*/, 2];
                                                                candles_1 = new Array(data.candles.length * constants_1.CANDLE_DEFAULT_ROW_LENGTH);
                                                                data.candles.forEach(function (candle, index) {
                                                                    var startIndex = index * constants_1.CANDLE_DEFAULT_ROW_LENGTH;
                                                                    candles_1[startIndex] = candle.time / 1000;
                                                                    candles_1[startIndex + 1] = candle.openAsk - ((candle.openAsk - candle.openBid) / 2);
                                                                    // candles[startIndex + 1] = candle.openAsk - ((candle.openAsk - candle.openBid) / 2);
                                                                    candles_1[startIndex + 2] = candle.highAsk - ((candle.highAsk - candle.highBid) / 2);
                                                                    candles_1[startIndex + 3] = candle.lowAsk - ((candle.lowAsk - candle.lowBid) / 2);
                                                                    candles_1[startIndex + 4] = candle.closeAsk - ((candle.closeAsk - candle.closeBid) / 2);
                                                                    candles_1[startIndex + 5] = candle.volume;
                                                                });
                                                                return [4 /*yield*/, onData(candles_1)];
                                                            case 1:
                                                                _a.sent();
                                                                _a.label = 2;
                                                            case 2:
                                                                resolve();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); });
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        i = 0, len = chunks.length;
                        _a.label = 1;
                    case 1:
                        if (!(i < len)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i, len)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     *
     * @param symbols
     */
    OandaApi.prototype.getCurrentPrices = function (symbols) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.getPrices(symbols, function (err, prices) {
                if (err)
                    return reject(err);
                resolve(prices);
            });
        });
    };
    OandaApi.prototype.placeOrder = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _options = {
                instrument: options.symbol,
                units: options.amount,
                side: options.side === constants_1.ORDER_SIDE_BUY ? 'buy' : 'sell',
                type: _this.orderTypeConstantToString(options.type)
            };
            _this._client.createOrder(_this.options.accountId, _options, function (err, result) {
                if (err)
                    return reject(err);
                resolve({
                    openTime: result.time,
                    openPrice: result.price,
                    b_id: result.tradeOpened.id
                });
            });
        });
    };
    OandaApi.prototype.closeOrder = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._client.closeOrder(_this.options.accountId, id, function (err, result) {
                if (err)
                    return reject(err);
                resolve(result);
            });
        });
    };
    OandaApi.prototype.updateOrder = function (id, options) {
    };
    OandaApi.prototype.destroy = function () {
        if (this._client)
            this._client.kill();
        this._client = null;
    };
    OandaApi.prototype._onPriceUpdateCallback = function (tick) {
        tick.bid = (tick.ask - (tick.ask - tick.bid) / 2).toPrecision(6);
        this.emit('tick', tick);
    };
    OandaApi.prototype.orderTypeConstantToString = function (type) {
        switch (type) {
            case constants_1.ORDER_TYPE_MARKET:
                return 'market';
            case constants_1.ORDER_TYPE_LIMIT:
                return 'limit';
            case constants_1.ORDER_TYPE_STOP:
                return 'stop';
            case constants_1.ORDER_TYPE_IF_TOUCHED:
                return 'marketIfTouched';
        }
    };
    OandaApi.FAVORITE_SYMBOLS = [
        'EUR_USD',
        'BCO_USD',
        'NZD_AUD'
    ];
    OandaApi.FETCH_CHUNK_LIMIT = 5000;
    OandaApi.WRITE_CHUNK_COUNT = 5000;
    return OandaApi;
}(events_1.EventEmitter));
exports.OandaApi = OandaApi;
