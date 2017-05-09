describe('Charts', function () {

    beforeEach(function () {
        return app.start();
    });

    afterEach(function () {
        return app.stop();
    });

    it('can open a chart', function () {
        return app.client.waitUntilWindowLoaded()
            .waitForExist('.instrument-list-rows-wrapper tr:first-child', 5000)
            .click('.instrument-list-rows-wrapper tr:first-child td:first-child')
            .waitForExist('.chart-overview-container chart-box', 5000);
    });

    // it('shows server connection error link that opens login screen', function () {
    //     return app.client.waitUntilWindowLoaded()
    //         .setNetworkConnection(1) // airplane mode off, wifi off, data off
    //         .waitForExist('#debugContainer status .circle.error', 5000)
    //         .getText('#debugContainer .error-message').should.eventually.equal('No server connection');
    // });
});