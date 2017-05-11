import * as fs      from 'fs';
import * as path    from 'path';
import * as _debug  from 'debug';
// import * as watch 	from 'node-watch';
import * as watch 	from 'watch';
import {fork, spawn}      from 'child_process';

const dirTree = require('directory-tree');
const debug = _debug('TradeJS:EditorController');
const rmdir = require('rmdir')

export default class EditorController {

	private pathCustom = path.join(__dirname, '../../custom/');

	constructor(protected opt, protected app) {
	}

	public async init() {
		return await this._startWatcher();
	}

	public load(filePath) {
		return new Promise((resolve, reject) => {
			debug(`Loading ${filePath}`);

			filePath = this._getFullPath(filePath);

			fs.readFile(filePath, (err, data) => {
				if (err) return reject(err);

				resolve(data.toString());
			});
		});
	}

	public async save(filePath, content) {
		await this._writeToFile(filePath, content);

		// return this._compile(inputPath, outputPath);
	}

	public rename(filePath, name) {

	}

	public delete(filePath) {
		console.log('sdfsdsdf', filePath);
		console.log('sdfsdsdf', filePath);

		return new Promise((resolve, reject) => {
			rmdir(filePath, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
			// fs.unlink(filePath, err => {
			//
			// });
		});

	}

	public getDirectoryTree() {
		return dirTree(this.pathCustom);
	}

	private _getFullPath(filePath) {
		return path.join(this.pathCustom, '../', filePath);
	}

	private _writeToFile(filePath: string, content: string) {

		return new Promise((resolve, reject) => {
			filePath = this._getFullPath(filePath);

			fs.writeFile(filePath, content, err => {
				if (err) return reject(err);

				resolve();
			});
		});
	}


	private async _compile(inputPath, outputPath) {

		return new Promise((resolve, reject) => {

			let npm = this.app.isWin ? 'npm.cmd' : 'npm',
				childOpt = {
					stdio: ['pipe', process.stdout, process.stderr],
					cwd: path.join(__dirname, '../')
				},
				child = spawn(npm, ['run', 'build:custom', `--input-path=${inputPath}`, `--output-path=${outputPath}`], childOpt);

			// child.stdout.on('data', console.log);

			// child.stderr.on('data', (data) => {
			// 	console.log(`stderr: ${data}`);
			// 	reject();
			// });

			child.on('close', (code) => {
				console.log(`child process exited with code ${code}`);

				code ? reject(code) : resolve();
			});
		});
	}

	private _startWatcher() {
		watch.watchTree(this.pathCustom, async (fileNames, curr, prev) => {
			if (typeof fileNames === 'object' && prev === null && curr === null) {
				let paths = Object.keys(fileNames);

				// console.log(paths);
				// console.log(paths[0]);

				// Finished walking the tre
				// console.log('asdasdasd', fileNames);
			} else if (prev === null) {
				debug('file:new', fileNames);
				this.app._io.sockets.emit('editor:changed', {});
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f is a new file
			} else if (curr.nlink === 0) {
				debug('file:removed', fileNames);
				this.app._io.sockets.emit('editor:changed', {});
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was removed
			} else {
				debug('file:changed', fileNames);
				this.app._io.sockets.emit('editor:changed', {});
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was changed
			}
		})

		// watch(this.pathCustom, {recursive: true}, async (evt, filePath) => {
		// 	console.log('asdfasdsadfsa', evt);
		// 	if (!fs.lstatSync(filePath).isDirectory())
		// 		return;
		//
		// 	let result = await this._compile(this._getCustomAbsoluteRootFolder(filePath), this._getBuildAbsoluteRootFolder(filePath));
		//
		// 	console.log(filePath, ' changed.', result);
		// });
	}

	// TODO: Bit of a hacky way to get root folder
	private _getFileRelativeRootFolder(filePath: string): string {
		return filePath.split('/').splice(1, 2).join('/');
	}

	private _getCustomAbsoluteRootFolder(filePath: string): string {
		return path.join(this.app.controllers.config.get().path.custom, this._getFileRelativeRootFolder(filePath));
	}

	private _getBuildAbsoluteRootFolder(filePath: string): string {
		return path.join(this.app.controllers.config.get().path.custom, '..', '_builds', this._getFileRelativeRootFolder(filePath));
	}

	/**
	 * UFO Situation happening right here
	 *
	 * @private
	 */
	private _syncWithClients() {
		this.app.io.emit('user:scripts:changed', );
	}
}
