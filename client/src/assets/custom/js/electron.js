window.electron = (() => {
    "use strict";

    if (window.isElectron) {
		const BrowserWindow = require('electron').remote.BrowserWindow;

		return {

			openWindow(url) {
				let win = new BrowserWindow({backgroundColor: '#2e2c29', frame: true});
				win.loadURL(url);
				window.editor = win;

				console.log(win);

				return win;
			}
		};
    }
})();