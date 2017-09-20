"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * SYSTEM
 */
exports.SYSTEM_STATE_BOOTING = -1, exports.SYSTEM_STATE_OK = 0, exports.SYSTEM_STATE_WARNING = 1, exports.SYSTEM_STATE_ERROR = 2, exports.SYSTEM_STATE_CODE_OK = 0, exports.SYSTEM_STATE_CODE_LOGIN = 1, exports.SYSTEM_STATE_CODE_BAD_BROKER_CONNECTION = 2, exports.SYSTEM_STATE_CODE_NO_BROKER_CONNECTION = 3, exports.SYSTEM_STATE_CODE_BAD_SERVER_CONNECTION = 4, exports.SYSTEM_STATE_CODE_NO_SERVER_CONNECTION = 5, 
/**
 * ORDER
 */
exports.ORDER_SIDE_BUY = 0, exports.ORDER_SIDE_SELL = 1, exports.ORDER_TYPE_NONE = 0, exports.ORDER_TYPE_MARKET = 1, exports.ORDER_TYPE_LIMIT = 2, exports.ORDER_TYPE_STOP = 3, exports.ORDER_TYPE_IF_TOUCHED = 4, 
/**
 * Broker - General
 */
exports.BROKER_GENERAL_TYPE_NONE = 0, exports.BROKER_GENERAL_TYPE_OANDA = 1, 
/**
 * Broker - TradeJS
 */
exports.BROKER_ERROR_UNKNOWN = 0, exports.BROKER_ERROR_INVALID_ARGUMENT = 1, exports.BROKER_ERROR_MARKET_CLOSED = 2, 
/**
 * Broker - OANDA
 */
exports.BROKER_OANDA_ERROR_INVALID_ARGUMENT = 1, exports.BROKER_OANDA_ERROR_MARKET_CLOSED = 24, 
/**
 * USER
 */
exports.USER_FETCH_TYPE_SLIM = 0, exports.USER_FETCH_TYPE_FULL = 1, exports.USER_FETCH_TYPE_PROFILE = 2, exports.USER_FETCH_TYPE_PROFILE_SETTINGS = 3, exports.USER_FETCH_TYPE_BROKER_DETAILS = 4, exports.USER_FETCH_TYPE_ACCOUNT_DETAILS = 5, 
/**
 * CHANNEL
 */
exports.CHANNEL_TYPE_MAIN = 0, exports.CHANNEL_TYPE_CUSTOM = 1, 
/**
 * REDIS
 */
exports.REDIS_USER_PREFIX = 'user_';
//# sourceMappingURL=constants.js.map