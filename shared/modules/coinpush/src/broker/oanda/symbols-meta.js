"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("../../constant");
exports.meta = [
    {
        "name": "AU200_AUD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_CAD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_NZD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "AUD_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "BCO_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CAD_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CAD_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CAD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CAD_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CH20_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CHF_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CHF_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CHF_ZAR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CN50_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "CORN_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "DE10YB_EUR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "DE30_EUR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EU50_EUR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_AUD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_CAD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_CZK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_DKK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_GBP",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_HUF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_NOK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_NZD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_PLN",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_SEK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_TRY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "EUR_ZAR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "FR40_EUR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_AUD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_CAD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_NZD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_PLN",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "GBP_ZAR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "HK33_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "HKD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "IN50_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "JP225_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NAS100_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NATGAS_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "NL25_EUR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_CAD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "NZD_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SG30_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SGD_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SGD_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SGD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SOYBN_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SPX500_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "SUGAR_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "TRY_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "TWIX_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "UK100_GBP",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "UK10YB_GBP",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "US2000_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "US30_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USB02Y_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USB05Y_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USB10Y_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USB30Y_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_CAD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_CHF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_CNH",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_CZK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_DKK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_HKD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_HUF",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_INR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_MXN",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_NOK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_PLN",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_SAR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_SEK",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_SGD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_THB",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_TRY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "USD_ZAR",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "WHEAT_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "WTICO_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_AUD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_CAD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_CHF",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_EUR",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_GBP",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_HKD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_JPY",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_NZD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_SGD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAG_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_AUD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_CAD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_CHF",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_EUR",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_GBP",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_HKD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_JPY",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_NZD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_SGD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_USD",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XAU_XAG",
        "type": constants.SYMBOL_CAT_TYPE_RESOURCE
    },
    {
        "name": "XCU_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "XPD_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "XPT_USD",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    },
    {
        "name": "ZAR_JPY",
        "type": constants.SYMBOL_CAT_TYPE_FOREX
    }
];
