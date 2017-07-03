'use strict';
const path = require('path'), gulp = require('gulp'), sourcemaps = require('gulp-sourcemaps'),
    fork = require('child_process').fork,
    spawn = require('child_process').spawn,
    runSequence = require('run-sequence'), ts = require('gulp-typescript'),
    serverTsProject = ts.createProject("tsconfig.json"), sharedTsProject = ts.createProject("../shared/tsconfig.json"),
    PATH_APP_INIT_FILE = path.resolve(__dirname, 'bootstrapper.js'), kill = require('tree-kill');
let child = null;

/***************************************************************
 *
 * SERVER SERVER SERVER SERVER SERVER
 *
 **************************************************************/
gulp.task('server:dev', callback => runSequence(['shared:build', 'server:build'], ['shared:watch', 'server:watch'], 'server:run', callback));
gulp.task('server:run', startChildProcess);
gulp.task('server:kill', killChildProcess);
gulp.task('server:watch', () => {
    gulp.watch(['!node_modules/**/*', './**/*.ts'], () => runSequence('server:kill', 'server:build', 'server:run'));
});
gulp.task('server:build', () => {
    return serverTsProject.src()
        .pipe(serverTsProject())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest("./"));
});
gulp.task('server:build:run', ['server:kill'], callback => {
    runSequence(['shared:copy-assets', 'server:build'], () => {
        buildCustom(null, () => {
            runSequence('server:run', callback);
        });
    });
});
/***************************************************************
 *
 * CUSTOM CUSTOM CUSTOM CUSTOM CUSTOM
 *
 **************************************************************/
gulp.task('custom:build' /*, ['custom:copy-assets']*/, callback => {
    buildCustom(null, callback);
});
gulp.task('custom:copy-assets', (callback) => {
    /* let inputPath = argv['input-path'] ? _getInputAbsoluteRootFolder(argv['input-path']) : path.join(__dirname, 'custom'),
     outputPath = argv['output-path'] ? _getOutputAbsoluteRootFolder(argv['output-path']) : path.join(__dirname, '_builds');

     gulp.src([inputPath + '/!**!/!*.json'])
     .pipe(gulp.dest(outputPath))
     .on('error', (error) => {
     console.log(error);
     })
     .on('end', callback);*/
});
/***************************************************************
 *
 * SHARED SHARED SHARED SHARED
 *
 **************************************************************/
gulp.task('shared:watch' /*, ['custom:copy-assets']*/, () => {
    gulp.watch(['../shared/!(node_modules)/**/*.ts'], () => runSequence('shared:build', 'server:kill', 'server:build', 'server:run'));
});
gulp.task('shared:build' /*, ['custom:copy-assets']*/, () => {
    return sharedTsProject.src()
        .pipe(sharedTsProject())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('../shared'))
        .pipe(gulp.dest("../shared"));
});
function startChildProcess(callback) {
    killChildProcess().then(() => {
        child = fork(PATH_APP_INIT_FILE, [...process.argv], {
            // execArgv: ['--inspect'],
            env: process.env,
            stdio: ['pipe', process.stdout, process.stderr, 'ipc']
        });
        child.on('exit', () => {
            child = null;
        });
        callback();
    });
}
function killChildProcess() {
    return new Promise(resolve => {
        if (child && child.pid) {
            kill(child.pid, 'SIGTERM', (err) => {
                if (err) {
                    console.error(err);
                    kill(child.pid, 'SIGKILL', (err) => {
                        if (err)
                            console.error(err);
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        }
        else
            resolve();
    });
}
function buildCustom(rootPath, callback = () => {
}) {
    let inputPath = rootPath ? _getInputAbsoluteRootFolder(rootPath) : path.resolve('..', 'custom'),
        outputPath = rootPath ? _getOutputAbsoluteRootFolder(rootPath) : path.resolve('..', '_builds');
    let tsProject = ts.createProject(path.resolve(__dirname, '../custom/tsconfig.json')),
        tsResult = gulp.src(`${inputPath}/**/*.ts`)
            .pipe(sourcemaps.init())
            .pipe(tsProject());
    return tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(outputPath))
        .on('end', callback);
}
// TODO: Bit of a hacky way to get root folder
function _getFileRelativeRootFolder(filePath) {
    return filePath.replace(path.resolve('..'), '').split('\\')[2] || '';
}
function _getInputAbsoluteRootFolder(filePath) {
    return path.resolve('..', 'custom', _getFileRelativeRootFolder(filePath));
}
function _getOutputAbsoluteRootFolder(filePath) {
    return path.resolve('..', '_builds', _getFileRelativeRootFolder(filePath));
}

//# sourceMappingURL=gulpfile.js.map
