import * as fs      from 'fs';
import * as path    from 'path';
import * as _debug  from 'debug';
// import * as watch 	from 'node-watch';
import * as watch 	from 'watch';
import {fork, spawn}      from 'child_process';
import Base from '../classes/Base';

const dirTree = require('directory-tree');
const debug = _debug('TradeJS:EditorController');
const rmdir = require('rmdir');

export default class EditorController extends Base {

	private _directoryTree = [];

	get directoryTree() {
		return this._directoryTree;
	}

	constructor(protected opt, protected app) {
		super(opt);
	}

	public async init() {
		this._directoryTree = await this._loadDirectoryTree();

		return await this._startWatcher();
	}

	public loadFile(filePath) {
		return new Promise((resolve, reject) => {
			debug(`Loading ${filePath}`);

			if (typeof filePath !== 'string')
				return reject('No filePath given');

			filePath = this._getFullPath(filePath);

			fs.readFile(filePath, (err, data) => {
				if (err) return reject(err);

				resolve(data.toString());
			});
		});
	}

	public async save(filePath, content) {
		return new Promise((resolve, reject) => {
			debug('save: ' + filePath);

			filePath = this._getFullPath(filePath);

			fs.writeFile(filePath, content, err => {
				if (err) return reject(err);

				resolve();
			});
		});
	}

	public rename(filePath, name) {
		return new Promise((resolve, reject) => {
			debug('rename: ' + filePath + ' to: ' + name);

			if (!this._isValidFileName(name))
				return reject('Invalid file name');

			let oFullPath = this._getFullPath(filePath),
				nFullPath = this._getFullPath(path.join(path.dirname(filePath), name));

			fs.rename(oFullPath, nFullPath, (err) => {
				if (err) {
					console.error(err);
					return reject(err);
				}

				resolve({
					id: path.join(path.dirname(filePath), name)
				});
			});
		});
	}

	public delete(filePath) {
		return new Promise((resolve, reject) => {
			debug('delete: ' + filePath);

			filePath = this._getFullPath(filePath);

			rmdir(filePath, (err, data) => {
				if (err)
					return reject(err);

				resolve();
			});
		});
	}

	public createFile(parent: string, name: string, content = '') {
		return new Promise(async (resolve, reject) => {
			debug('Create file: ' + name);

			if (typeof parent !== 'string')
				return reject('No parent directory given');

			// Check valid fileName
			if (this._isValidFileName(name) === false)
				return reject('Invalid file name');

			let fullPath = path.join(this._getFullPath(parent), name);

			// Check if file does not exist already
			if (await this._fileOrDirectoryExists(fullPath))
				return reject('File already exists');

			fs.writeFile(fullPath, content, (err) => {
				if (err) return reject(err);

				// this.emit('change');
				resolve({
					id: path.join(parent, name)
				});
			});
		});
	}

	public createDirectory(parent: string, name: string) {

		return new Promise(async (resolve, reject) => {
			debug('Create directory: ' + name);

			if (typeof parent !== 'string')
				return reject('No parent directory given');

			if (typeof name !== 'string')
				return reject('No directory name given');

			if (!this._isValidDirectoryName(name))
				return reject('Invalid directory name');

			let fullPath = path.join(this._getFullPath(parent), name);

			// Check if file does not exist already
			if (await this._fileOrDirectoryExists(fullPath))
				return reject('Directory already exists');

			fs.mkdir(fullPath, (err) => {
				if (err) return reject(err);

				resolve({
					id: path.join(parent, name)
				});
			});
		});
	}

	private _loadDirectoryTree() {
		debug('Load directory tree');

		let tree = dirTree(this.app.controllers.config.config.path.custom).children;

		return this._normalizeDirectoryTree(tree);
	}

	private _normalizeDirectoryTree(arr: any): Array<any> {
		for (let i = 0, len = arr.length, node; i < len; i++) {
			node = arr[i];

			node.id = node.path.replace(this.app.controllers.config.config.path.custom, '');
			node.isFile = !node.children;

			if (node.children)
				this._normalizeDirectoryTree.call(this, node.children);
		}

		return arr;
	}

	private _getFullPath(filePath): string {
		if (!filePath)
			throw new Error('No fileName given');

		let pathCustom = this.app.controllers.config.config.path.custom;
		return path.join(pathCustom, filePath);
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
		watch.watchTree(this.app.controllers.config.config.path.custom, async (fileNames, curr, prev) => {
			if (typeof fileNames === 'object' && prev === null && curr === null) {
				let paths = Object.keys(fileNames);

				// console.log(paths);
				// console.log(paths[0]);

				// Finished walking the tre
				// console.log('asdasdasd', fileNames);
				this.emit('change');
			} else if (prev === null) {
				debug('file:new', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f is a new file
			} else if (curr.nlink === 0) {
				debug('file:removed', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was removed
			} else {
				debug('file:changed', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was changed
			}
		})
	}

	private _isValidFileName(name) {
		return !/[^-_.A-Za-z0-9]/i.test(name);
	}

	private _isValidDirectoryName(name) {
		return !/^[a-zA-Z]:\\(\w+\\)*\w*$/.test(name)
	}

	private _fileOrDirectoryExists(name) {
		return new Promise((resolve, reject) => {
			fs.stat(name, (err, stat) => {
				resolve(!err);
			});
		});
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
}
