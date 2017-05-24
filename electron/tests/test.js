const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const fs = require('fs');
const chaiAsPromised = require('chai-as-promised');
const rimraf = require('rimraf');

var electronPath = '',
	configPath = '',
	cachePath = '';

if (/^win/.test(process.platform)) {
	electronPath = path.join(__dirname, '..', '..', 'dist', 'win-unpacked', 'TradeJS.exe');
	configPath = path.join(__dirname, '..', '..', 'dist', 'win-unpacked', 'resources', 'app', '_config');
	cachePath = path.join(__dirname, '..', '..', 'dist', 'win-unpacked', 'resources', 'app', '_cache');
} else if (/^darwin/.test(process.platform)) {
	electronPath = path.join(__dirname, '..', '..', 'dist', 'mac', 'TradeJS.app', 'Contents', 'MacOS', 'TradeJS');
	configPath = path.join(__dirname, '..', '..', 'dist', 'mac', 'TradeJS.app', 'Contents', 'MacOS', 'resources', 'app', '_config');
	cachePath = path.join(__dirname, '..', '..', 'dist', 'mac', 'TradeJS.app', 'Contents', 'MacOS', 'resources', 'app', '_cache');
} else if (/^linux/.test(process.platform)) {
	electronPath = path.join(__dirname, '..', '..', 'dist', 'linux-unpacked', 'tradejs');
	configPath = path.join(__dirname, '..', '..', 'dist', 'linux-unpacked', 'resources', 'app', '_config');
	cachePath = path.join(__dirname, '..', '..', 'dist', 'linux-unpacked', 'resources', 'app', '_cache');
}

var loginDetails = {
	accountId: 1218398,
    token: '067331173f67faf3cef7e69263a3015a-fefb596cddfe98d2f24e9ca843c3c443'
};

var appPath = path.join(__dirname, '..', '..');

var app = new Application({
	path: electronPath,
	args: [appPath, 'NODE_ENV=production']
});

global.before(function () {
	chai.should();
	chai.use(chaiAsPromised);
});

global.beforeEach(function () {
	return app.start();
});

global.afterEach(function () {
	return app.stop().then(() => {
		rimraf.sync(configPath);
		rimraf.sync(cachePath);
	});
});

describe('Window', function () {

	it('opens a window', function () {
		return app.client
			.waitUntilWindowLoaded()
			.getWindowCount().should.eventually.equal(1);
	});

	it('tests the title', function () {
		return app.client
			.waitUntilWindowLoaded()
			.getTitle().should.eventually.equal('TradeJS - Practise');
	});
});

describe('Server Connection', function () {

	it('connects to server', function () {
		return app.client
			.waitUntilWindowLoaded()
			.waitForVisible('#loginModal')
			.setValue('#loginAccountId', loginDetails.accountId)
			.setValue('#loginToken', loginDetails.token)
			.click('#loginModal .modal-footer .btn-primary')
			.waitForVisible('#loginModal')
			.waitForExist('#debugContainer .circle.ok', 5000);
	});
});

describe('Charts', function () {

	it('can open a chart', function () {
		return app.client
			.waitUntilWindowLoaded()
			.waitForVisible('#loginModal')
			.setValue('#loginAccountId', loginDetails.accountId)
			.setValue('#loginToken', loginDetails.token)
			.click('#loginModal .modal-footer .btn-primary')
			.waitForExist('#debugContainer .circle.ok', 5000)
			.pause(500)
			.waitForExist('.three-column:first-child tr:first-child', 5000)
			.click('.three-column:first-child tr:first-child td:first-child')
			.waitForExist('.chart-overview-container chart-box', 5000);
	});
});

describe('Editor', function () {

	it('can open editor window', function () {
		return app.client
			.waitUntilWindowLoaded()
			.waitForVisible('.header-buttons .button-editor')
			.click('.header-buttons .button-editor')
			.pause(500)
			.windowByIndex(1)
			.waitForVisible('.editor.ace_editor', 5000);
	});
});