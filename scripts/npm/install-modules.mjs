import { spawn } from 'child_process';
import * as path from 'path';

const folders = [
    'client',
    // 'client-app',
    'server-cache',
    'server-comment',
    'server-event',
    'server-gateway',
    'server-notify',
    'server-user',
    'shared/modules/coinpush',
];

// (async function() {
    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];

        // await new Promise((resolve, reject) => {
            const folderPath = path.join('./../..', folder);
            const worker = spawn(`cd ${folderPath} && npm i --quiet --no-progress`, { 
                shell: true, 
                stdio: [null, process.stdout, process.stderr] 
            });
    
            worker.once('close', () => {
                console.log(folder, 'done');
                // resolve();
            })
        // });
    }
// })();