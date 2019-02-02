"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
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
var util_date_1 = require("../../util/util.date");
var querystring_1 = require("querystring");
var util_log_1 = require("../../util/util.log");
var events_1 = require("events");
var constants_1 = require("../../constant/constants");
var request = require("requestretry");
var symbols_1 = require("./symbols");
var io = require("socket.io-client");
var util_cc_1 = require("./util.cc");
var currentPrice = {};
var CyrptoCompareApi = /** @class */ (function (_super) {
    __extends(CyrptoCompareApi, _super);
    function CyrptoCompareApi(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        _this._activeSubs = [];
        _this._latestBtcUsd = 0;
        _this._reconnectTimeout = null;
        _this._reconnectTimeoutTime = 10000;
        _this._client = null;
        _this._setupSocketIO();
        _this._socket.emit('SubAdd', { subs: ["5~CCCAGG~BTC~USD"] });
        return _this;
    }
    CyrptoCompareApi.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(true)];
            });
        });
    };
    CyrptoCompareApi.prototype.subscribePriceStream = function (symbols) {
        //Format: {SubscriptionId}~{ExchangeName}~{FromSymbol}~{ToSymbol}
        //Use SubscriptionId 0 for TRADE, 2 for CURRENT and 5 for CURRENTAGG
        //For aggregate quote updates use CCCAGG as market
        this._activeSubs = symbols.map(function (symbol) { return "5~CCCAGG~" + symbol.name + "~BTC"; });
        this._socket.emit('SubAdd', { subs: this._activeSubs });
    };
    CyrptoCompareApi.prototype.unsubscribePriceStream = function (instruments) {
        this._socket.disconnect();
        this._socket = null;
    };
    CyrptoCompareApi.prototype.getSymbols = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, normalized, key, coin, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, request({
                                uri: 'https://min-api.cryptocompare.com/data/all/coinlist',
                                fullResponse: false,
                                json: true
                            })];
                    case 1:
                        result = _a.sent();
                        normalized = [];
                        for (key in result.Data) {
                            coin = result.Data[key];
                            if (symbols_1.symbols.indexOf(coin.Name) === -1)
                                continue;
                            constants_1.SYMBOL_CAT_TYPE_COMPANY;
                            normalized.push({
                                type: constants_1.SYMBOL_CAT_TYPE_CRYPTO,
                                name: coin.Name,
                                displayName: coin.CoinName,
                                img: 'https://www.cryptocompare.com' + coin.ImageUrl,
                                broker: constants_1.BROKER_GENERAL_TYPE_CC
                            });
                        }
                        return [2 /*return*/, normalized];
                    case 2:
                        error_1 = _a.sent();
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CyrptoCompareApi.prototype.getCandles = function (symbol, timeFrame, from, until, count, onData) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, writeChunks, finished, url, _loop_1, this_1, i, len;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        until = until || Date.now() + (1000 * 60 * 60 * 24);
                        chunks = util_date_1.splitToChunks(timeFrame, from, until, count, CyrptoCompareApi.FETCH_CHUNK_LIMIT), writeChunks = 0, finished = 0, url = '';
                        if (!chunks.length)
                            return [2 /*return*/];
                        switch (timeFrame) {
                            case 'M1':
                                url = 'https://min-api.cryptocompare.com/data/histominute?';
                                break;
                            case 'H1':
                                url = 'https://min-api.cryptocompare.com/data/histohour?';
                                break;
                            case 'D':
                                url = 'https://min-api.cryptocompare.com/data/histoday?';
                                break;
                        }
                        _loop_1 = function (i, len) {
                            var chunk, result, candles;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        chunk = chunks[i];
                                        return [4 /*yield*/, this_1._doRequest(url, {
                                                limit: count || 400,
                                                fsym: symbol,
                                                tsym: 'USD',
                                                toTs: chunk.until
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.Data || !result.Data.length)
                                            return [2 /*return*/, "continue"];
                                        candles = new Array(result.Data.length * constants_1.CANDLE_DEFAULT_ROW_LENGTH);
                                        result.Data.forEach(function (candle, index) {
                                            var startIndex = index * constants_1.CANDLE_DEFAULT_ROW_LENGTH;
                                            var time = candle.time * 1000;
                                            candles[startIndex] = candle.time * 1000;
                                            candles[startIndex + 1] = candle.open;
                                            candles[startIndex + 2] = candle.high;
                                            candles[startIndex + 3] = candle.low;
                                            candles[startIndex + 4] = candle.close;
                                            candles[startIndex + 5] = Math.ceil(Math.abs(candle.volumeto - candle.volumefrom)); // TODO: can't be right but places BTC -> ETC -> LTC nice in order for some reason..
                                        });
                                        return [4 /*yield*/, onData(candles)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
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
    CyrptoCompareApi.prototype.getCurrentPrices = function (symbols, toSymbol) {
        if (toSymbol === void 0) { toSymbol = 'USD'; }
        return __awaiter(this, void 0, void 0, function () {
            var priceArr, i, len, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        priceArr = [];
                        i = 0, len = symbols.length;
                        _a.label = 1;
                    case 1:
                        if (!(i < len)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._doRequest('https://min-api.cryptocompare.com/data/price?', { fsym: symbols[i], tsyms: toSymbol })];
                    case 2:
                        result = _a.sent();
                        priceArr.push({ instrument: symbols[i], bid: result[toSymbol] });
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, priceArr];
                }
            });
        });
    };
    CyrptoCompareApi.prototype.destroy = function () {
        if (this._client)
            this._client.kill();
        this._client = null;
    };
    CyrptoCompareApi.prototype._doRequest = function (url, params, reattempt) {
        if (reattempt === void 0) { reattempt = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2, calls;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 6]);
                        return [4 /*yield*/, request({
                                uri: url + querystring_1.stringify(params),
                                json: true,
                                maxAttempts: 3,
                                retryDelay: 2000,
                                fullResponse: false
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_2 = _a.sent();
                        return [4 /*yield*/, this._getCallsInMinute()];
                    case 3:
                        calls = _a.sent();
                        if (!(!calls || !calls.CallsLeft.Histo)) return [3 /*break*/, 5];
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = resolve;
                                                return [4 /*yield*/, this._doRequest(url, params, ++reattempt)];
                                            case 1:
                                                _a.apply(void 0, [_b.sent()]);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }, 1000);
                            })];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: throw error_2;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CyrptoCompareApi.prototype._getCallsInMinute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, request({
                                uri: 'https://min-api.cryptocompare.com/stats/rate/minute/limit',
                                json: true,
                                fullResponse: false
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CyrptoCompareApi.prototype._setupSocketIO = function () {
        var _this = this;
        this._socket = io.connect('https://streamer.cryptocompare.com/');
        this._socket.on('connect', function () {
            util_log_1.log.info('CryptoCompare', 'Socket connected');
            _this._socket.emit('SubAdd', { subs: ["5~CCCAGG~BTC~USD"] });
            _this._socket.emit('SubAdd', { subs: _this._activeSubs });
        });
        this._socket.on("disconnect", function (message) {
            util_log_1.log.info('CryptoCompare', 'Socket disconnected, reconnecting and relistening symbols');
            clearTimeout(_this._reconnectTimeout);
            _this._reconnectTimeout = setTimeout(function () { return _this._socket.connect(); }, _this._reconnectTimeoutTime);
        });
        this._socket.on("connect_error", function (error) {
            util_log_1.log.error('connect error!', error);
            clearTimeout(_this._reconnectTimeout);
            _this._reconnectTimeout = setTimeout(function () { return _this._socket.connect(); }, _this._reconnectTimeoutTime);
        });
        this._socket.on("reconnect_error", function (error) {
            util_log_1.log.error('reconnect error!', error);
            clearTimeout(_this._reconnectTimeout);
            _this._reconnectTimeout = setTimeout(function () { return _this._socket.connect(); }, _this._reconnectTimeoutTime);
        });
        // on tick(s)
        this._socket.on("m", function (message) {
            var messageType = message.substring(0, message.indexOf("~"));
            var res = util_cc_1.CCC.CURRENT.unpack(message);
            if (res.FROMSYMBOL === 'BTC') {
                if (res.TOSYMBOL === 'BTC')
                    return;
                if (res.TOSYMBOL === 'USD')
                    _this._latestBtcUsd = res.PRICE;
            }
            if (_this._latestBtcUsd && res.PRICE) {
                if (!(res.FROMSYMBOL === 'BTC' && res.TOSYMBOL === 'USD')) {
                    res.PRICE = parseFloat((res.PRICE * _this._latestBtcUsd)).toPrecision(6);
                }
                _this.emit('tick', {
                    time: res.LASTUPDATE * 1000,
                    instrument: res.FROMSYMBOL,
                    bid: res.PRICE
                });
            }
            else {
                // console.log(res);
            }
        });
    };
    CyrptoCompareApi.FETCH_CHUNK_LIMIT = 2000;
    CyrptoCompareApi.WRITE_CHUNK_COUNT = 2000;
    return CyrptoCompareApi;
}(events_1.EventEmitter));
exports.default = CyrptoCompareApi;
function dataUnpack(data) {
    var from = data['FROMSYMBOL'];
    var to = data['TOSYMBOL'];
    var fsym = util_cc_1.CCC.STATIC.CURRENCY.getSymbol(from);
    var tsym = util_cc_1.CCC.STATIC.CURRENCY.getSymbol(to);
    var pair = from + to;
    if (!currentPrice.hasOwnProperty(pair)) {
        currentPrice[pair] = {};
    }
    for (var key in data) {
        currentPrice[pair][key] = data[key];
    }
    if (currentPrice[pair]['LASTTRADEID']) {
        currentPrice[pair]['LASTTRADEID'] = parseInt(currentPrice[pair]['LASTTRADEID']).toFixed(0);
    }
    currentPrice[pair]['CHANGE24HOUR'] = util_cc_1.CCC.convertValueToDisplay(tsym, (currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']));
    currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";
    ;
    // displayData(currentPrice[pair], from, tsym, fsym);
}
;
