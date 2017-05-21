const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const fs = require('fs');
const chaiAsPromised = require('chai-as-promised');

var electronPath = '',
    configPath = '';

if (/^win/.test(process.platform)) {
    electronPath = path.join(__dirname, '..', '..', 'dist', 'win-unpacked', 'TradeJS.exe');
} else if (/^darwin/.test(process.platform)) {
    electronPath = path.join(__dirname, '..', '..', 'dist', 'mac', 'TradeJS.app', 'Contents', 'MacOS', 'TradeJS');
} else if (/^linux/.test(process.platform)) {
    electronPath = path.join(__dirname, '..', '..', 'dist', 'linux-unpacked', 'tradejs');
}

var appPath = path.join(__dirname, '..', '..');

var app = new Application({
    path: electronPath,
    args: [appPath, 'NODE_ENV=production']
});

global.before(function () {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('Window', function () {
    beforeEach(function () {
        return app.start();
    });

    afterEach(function () {
        fs.unlinkSync(path.join(electronPath, '..', 'resources', 'app', '_config', 'tradejs.config.json'));
        return app.stop();
    });

    it('opens a window', function () {
        return app.client.waitUntilWindowLoaded()
            .getWindowCount().should.eventually.equal(1);
    });

    it('tests the title', function () {
        return app.client.waitUntilWindowLoaded()
            .getTitle().should.eventually.equal('TradeJS - Practise');
    });
});

describe('Server Connection', function () {
    beforeEach(function () {
        return app.start()
    });

    afterEach(function () {
        return app.stop();
    });

    it('connects to server', function () {
        return app.client.waitUntilWindowLoaded()
            .waitForExist('#debugContainer .circle.ok', 5000);
    });
});

describe('Charts', function () {

    beforeEach(function () {
        return app.start();
    });

    afterEach(function () {
        return app.stop();
    });

    it('can open a chart', function () {
        return app.client.waitUntilWindowLoaded()
            .pause(10000)
            .waitForExist('.three-column:first-child tr:first-child', 5000)
            .click('.three-column:first-child tr:first-child td:first-child')
            .waitForExist('.chart-overview-container chart-box', 5000);
    });
});

describe('Backtest', function () {

    beforeEach(function () {
        return app.start();
    });

    afterEach(function () {
        return app.stop();
    });

    it('can resize the debugger', function () {
        return app.client.waitUntilWindowLoaded();
    });
});

describe('Editor', function () {

    beforeEach(function () {
        return app.start();
    });

    afterEach(function () {
        return app.stop();
    });

    it('can open a chart', function () {
        return app.client.waitUntilWindowLoaded()
    });
});