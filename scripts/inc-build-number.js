const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../client/package.json');
const OUT_FILE_PATH = path.join(__dirname, '../client/dist/www/config.json');

const packageObject = require(FILE_PATH);

packageObject.version = setLastDigit(packageObject.version);

fs.writeFileSync(FILE_PATH, JSON.stringify(packageObject, null, 2));
fs.writeFileSync(OUT_FILE_PATH, JSON.stringify({
    version: packageObject.version
}, null, 2));

function setLastDigit(string) {
    const arr = string.split('.');
    arr[arr.length - 1] = parseInt( arr[arr.length - 1], 10) + 1 || 1;

    console.log('new version: ', arr.join('.'));

    return arr.join('.');
}