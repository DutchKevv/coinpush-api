"use strict";

process.env.NODE_ENV = 'production';

const builder = require("electron-builder");
const Platform = builder.Platform;
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const startTime = Date.now();

builder.build({
		target: new Platform("windows", "win", "win32"),
		projectDir: '../',
		config: {
			compression: 'normal',
			artifactName: 'TradeJS ${version}.${ext}',
			productName: 'TradeJS',
			electronVersion: '1.6.6',
			"asar": false,
			"appId": "com.electron.tradejs",
			"mac": {
				"category": "your.app.category.type"
			},
			"win": {
				icon: path.join(__dirname, 'assets', 'icon'),
				publisherName: 'H.K.Brandsma'
			},
			nsis: {
				oneClick: false,
				perMachine: false,
				allowToChangeInstallationDirectory: true,
				license: path.join(__dirname, '..', 'license.txt'),
				// requestExecutionLevel: 'admin'
			},
			afterPack: function (options) {
				// console.log('OPTIONS', options);

				return new Promise((resolve, reject) => {
					let from = path.join(__dirname, '..', 'server', 'node_modules', 'sqlite3', 'bin', 'win32-x64-53', 'sqlite3.node'),
						to = path.join(options.appOutDir, 'resources', 'app', 'server', 'node_modules', 'sqlite3', 'lib', 'binding', 'node-v53-win32-x64', 'node_sqlite3.node');

						mkdirp(path.dirname(to), err  => {
							if(err) return reject(err);

							fs
								.createReadStream(from)
								.pipe(fs.createWriteStream(to))
								.on('finish', resolve)
						});

				});
			},
			files: [
				'!_cache/*',
				'!client/node_modules/*',
				'!electron/node_modules/*',
				'!electron/assets/*'
			]
		}
	})
	.then(() => {
		console.log('DONE', (Date.now() - startTime) / 1000, 'seconds');
		// handle result
	})
	.catch((error) => {
		console.error(error);
		// handle error
	});
