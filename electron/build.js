"use strict"

const builder = require("electron-builder")
const Platform = builder.Platform;

// Promise is returned
builder.build({
		projectDir: '../',
		dir: true,
		config: {
			afterPack: (result) => {

			},
			"appId": "com.example.app",
			"electronVersion": "1.6.6",
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
				"!client/node_modules",
				"!client/assets",
				"!client/app",
				"!electron/node_modules",
				"!electron/assets",
				"!electron/tests",
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
				"license": "license.txt",
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