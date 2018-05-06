import * as fs from 'fs';

export const config: any = {};

setInterval(() => {
    const file = fs.readFileSync('../../tradejs.config.js');
    console.log(file);
}, 5000);