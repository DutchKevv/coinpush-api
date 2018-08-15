const path = require('path');
const spritesheet = require('spritesheet-js');

const IMAGES_WRITE_PATH = path.join(__dirname, 'images');
const SPRITE_WRITE_PATH = path.join(__dirname);
// const SPRITE_WRITE_PATH = path.join(__dirname, '..', '..', 'src', 'app', 'style', 'sprite');

const build = async function () {
    spritesheet(IMAGES_WRITE_PATH + '\\*.png', {
        prefix: 'symbol-img-',
        format: 'css',
        path: SPRITE_WRITE_PATH
    }, function (err) {
        if (err) throw err;

        console.log('spritesheet successfully generated');
    });
};

build().catch(console.log);
