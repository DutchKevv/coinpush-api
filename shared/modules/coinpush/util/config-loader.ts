import * as fs from 'fs';

export const config: any = {};

setInterval(() => {
    const file = fs.readFileSync('../../tradejs.config.js');
}, 5000);