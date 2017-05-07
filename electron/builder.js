"use strict";

process.env.NODE_ENV = 'production';

const
    builder = require("electron-builder"),
    Platform = builder.Platform,
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    argv = require('minimist')(process.argv.slice(2)),

    startTime = Date.now();

/**
 *
 * Get platform target
 */
let target = [],
    platform = '';


// Windows
if (argv.platform === 'windows' || (!argv.platform && /^win/.test(process.platform))) {
    platform = 'windows';
    target = ["windows", "win", "win32"]
}
// Mac
else if (argv.platform === 'mac' || (!argv.platform && /^darwin/.test(process.platform))) {
    platform = 'mac';
    target = ["mac", "mac", "darwin"];
}
// Linux
else if (argv.platform === 'linux' || (!argv.platform && /^linux/.test(process.platform))) {
    platform = 'linux';
}


/**
 *
 * Build
 */
builder.build({
    target: new Platform(...target),
    plaform: 'all',
    projectDir: '../',
    // platform: 'osx',
    config: {
        compression: 'normal',
        artifactName: 'TradeJS ${version}.${ext}',
        productName: 'TradeJS',
        electronVersion: '1.6.6',
        asar: true,
        appId: "com.electron.tradejs",
        mac: {
            category: "your.app.category.type",
            icon: path.join(__dirname, 'assets', 'icon'),
        },
        win: {
            icon: path.join(__dirname, 'assets', 'icon'),
            publisherName: 'H.K.Brandsma'
        },
        nsis: {
            oneClick: false,
            perMachine: false,
            allowToChangeInstallationDirectory: true,
            license: path.join(__dirname, '..', 'license.txt'),
            allowElevation: true
        },
        portable: {
            requestExecutionLevel: 'admin'
        },
        afterPack: function (options) {
            console.log('OPTIONS OPTIONS OPTIONS OPTIONS', options);

            // if (platform === 'windows') {
            //     return new Promise((resolve, reject) => {
            //
            //         let from = path.join(__dirname, '..', 'server', 'node_modules', 'sqlite3', 'bin', 'win32-x64-53', 'sqlite3.node'),
            //             to = path.join(options.appOutDir, 'resources', 'app', 'server', 'node_modules', 'sqlite3', 'lib', 'binding', 'node-v53-win32-x64', 'node_sqlite3.node');
            //
            //         mkdirp(path.dirname(to), err => {
            //             if (err) return reject(err);
            //
            //             fs
            //                 .createReadStream(from)
            //                 .pipe(fs.createWriteStream(to))
            //                 .on('finish', resolve)
            //         });
            //     });
            // }
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
