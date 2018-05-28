"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
exports.config = {};
setInterval(function () {
    var file = fs.readFileSync('../../tradejs.config.js');
}, 5000);
