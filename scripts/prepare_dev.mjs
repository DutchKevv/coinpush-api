import { spawn, execSync, exec } from 'child_process';
import * as path from 'path';

const folders = [
    'client',
    'client-app',
    'server-cache',
    'server-comment',
    'server-event',
    'server-gateway',
    'server-notify',
    'server-user',
    'shared/modules/coinpush',
];

/**
 * GLOBALS
 */
try {
    console.log('installing cordova')
    execSync('npm i -g cordova', {stdio:[0,1,2]});
} catch (error) {
    console.error(error);
}

try {
    console.log('building docker images')
    execSync('cd ../ && npm run build-client && npm run build-server', {stdio:[0,1,2]});
} catch (error) {
    console.error(error);
}

try {
    console.log('installing npm modules (locally)')
    execSync('cd ../ && npm run install-npm-modules', {stdio:[0,1,2]});
} catch (error) {
    console.error(error);
}