import * as fs from 'fs';
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

const deleteFolderRecursive = function(path) {
    if ( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  };

folders.forEach(folder => {
    const folderRoot = path.join('./../..', folder);
    const folderModules = path.join(folderRoot, 'node_modules');
    const folderPackageLock = path.join(folderRoot, 'package-lock.json');

    deleteFolderRecursive(folderModules);

    if (fs.existsSync(folderPackageLock)) {
        fs.unlinkSync(folderPackageLock);
    }

    console.log('cleaned: ', folder);
});