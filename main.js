const path = require('path');

if (process && process.versions['electron']) {
	module.exports = require(path.join(__dirname, 'electron', 'index.js'));
} else {
	module.exports = require(path.join(__dirname, 'server', '_app.js'));
}