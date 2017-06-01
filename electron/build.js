"use strict"

const builder = require("electron-builder");
const Platform = builder.Platform;
const argv = require('minimist')(process.argv.slice(2));

// Promise is returned
builder.build({
		projectDir: '../',
		dir: !argv.packed,
		config: {
			afterPack: (result) => {

			},
			"appId": "com.example.app",
			"electronVersion": "1.6.10",
			"productName": "TradeJS",
			"artifactName": "${productName}.${ext}",
			"asar": true,
			"files": [
				"**/*",
				"package.json",
				"!**/gulpfile.*",
				"!_cache",
				"!_config",
				"!dist",
				"!custom/indicator/*",

				"!client/*",
				"client/dist/*",

				"!electron/*",
				"electron/index.js",

				"!server/node_modules/**/*.map",
				"!server/node_modules/**/Makefile",
				"!server/node_modules/**/.npmignore",
				"!server/node_modules/**/*.md"
			],
			"mac": {
				"target": "dmg",
				"icon": "./electron/assets/icon",
				"category": "your.app.category.type"
			},
			"win": {
				"target": "nsis",
				"icon": "./electron/assets/icon",
				"publisherName": "H.K.Brandsma"
			},
			"linux": {
				"target": "deb",
				"icon": "electron/assets/",
				"maintainer": "kewin@frontend-freelance.com"
			},
			"nsis": {
				"oneClick": false,
				"perMachine": false,
				"allowToChangeInstallationDirectory": true,
				"license": "LICENSE.txt",
				"allowElevation": true
			}
		}
	})
	.then(result => {
		// handle result
		console.log('result', result);
	})
	.catch((error) => {
		console.error(error);
		// handle error
	})