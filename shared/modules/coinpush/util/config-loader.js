"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
exports.config = {};
setInterval(function () {
    var file = fs.readFileSync('../../tradejs.config.js');
    console.log(file);
}, 5000);
//# sourceMappingURL=config-loader.js.map