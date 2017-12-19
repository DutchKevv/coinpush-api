const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');
const download = require('image-downloader');
const loadImage = require('image-promise');
const BrokerMiddleware = require('../../shared/brokers/broker.middleware').BrokerMiddleware;

https.globalAgent.maxSockets = 2;

const broker = new BrokerMiddleware();

const DEFAULT_IMG_PATH = path.join(__dirname, '..', '..', 'images', 'images', 'default', 'symbol', 'default.symbol.png');
const IMAGES_WRITE_PATH = path.join(__dirname, '..', 'src', 'assets', 'sprite', 'images');
const SPRITE_WRITE_PATH = path.join(__dirname, '..', 'src', 'assets', 'image');
const CSS_WRITE_PATH = path.join(__dirname, '..', 'src', 'assets', 'custom', 'css');

const build = async function () {

    // load symbols
    await broker.setSymbols();

    // load images to disk
    for (let i = 0; i < broker.symbols.length; i++) {
        const symbol = broker.symbols[i];
        const fullPath = path.join(IMAGES_WRITE_PATH, symbol.name + '.png');
        const writeStream = fs.createWriteStream(fullPath);

        if (!symbol.img.startsWith('/images/')) {
            https.get(symbol.img, response => response.pipe(sharp().resize(20).max()).pipe(writeStream));
        } else {
            await fs.createReadStream(DEFAULT_IMG_PATH).pipe(writeStream);
        }
    }

    // build sprite
    // const options = {
    //     out: SPRITE_WRITE_PATH,
    //     src: IMAGES_WRITE_PATH + '/*.{png,jpg}',
    //     split: true,
    //     name: 'icons',
    //     processor: 'sprity-sass',
    // }

    // sprity.create(options, () => {
    //     console.log('DONE!!');
    // });
};

build().catch(console.error);
