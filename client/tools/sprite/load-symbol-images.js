const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const BrokerMiddleware = require('../../../shared/modules/coinpush/src/broker/broker.middleware').BrokerMiddleware;
https.globalAgent.maxSockets = 2;

const broker = new BrokerMiddleware();

const DEFAULT_IMG_PATH = path.join(__dirname, '..', '..', '..', 'static', 'image', 'default', 'symbol', 'default.symbol.png');
const IMAGES_WRITE_PATH = path.join(__dirname, 'images');

if (!fs.existsSync(IMAGES_WRITE_PATH)){
    fs.mkdirSync(IMAGES_WRITE_PATH);
}

const load = async function () {
    // load symbols
    const symbols = await broker.getSymbols();

    await Promise.all(symbols.map(symbol => {
        const fullPath = path.join(IMAGES_WRITE_PATH, symbol.name + '.png');
        const writeStream = fs.createWriteStream(fullPath);

        return new Promise((resolve, reject) => {
            if (symbol.img.startsWith('/image/')) {
                fs.createReadStream(DEFAULT_IMG_PATH)
                    .on('end', resolve)
                    .pipe(sharp().resize(30))
                    .pipe(writeStream);
            } else {
                https.get(symbol.img, response => response.pipe(sharp().resize(30))
                    .on('end', resolve)
                    .pipe(writeStream));
            }
        });
    }))
};

load().catch(console.log);
