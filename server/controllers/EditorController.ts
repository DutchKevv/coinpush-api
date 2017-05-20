import * as fs      from 'fs';
import * as path    from 'path';
import * as winston	from 'winston-color';
import * as mkdirp  from 'mkdirp';
import * as watch 	from 'watch';
import {fork}      	from 'child_process';
import Base from '../classes/Base';

const dirTree = require('directory-tree');
const rmdir = require('rmdir');

export default class EditorController extends Base {

	private _directoryTree = [];
	private _runnableList = {
		ea: [],
		indicator: [],
		template: []
	};

	get directoryTree() {
		return this._directoryTree;
	}

	get runnableList() {
		return this._runnableList;
	}

	constructor(protected opt, protected app) {
		super(opt);
	}

	public async init() {
		// Ensure path to custom folder exists and it has ea, indicator, templates folder inside
		mkdirp.sync(this.app.controllers.config.config.path.custom);
		mkdirp.sync(path.join(this.app.controllers.config.config.path.custom, 'ea'));
		mkdirp.sync(path.join(this.app.controllers.config.config.path.custom, 'indicator'));
		mkdirp.sync(path.join(this.app.controllers.config.config.path.custom, 'templates'));

		// Load the directory tree into memory
		this._loadDirectoryTreeSync();
		this._loadRunnableList();

		// TODO - Do not load list with every change!
		this.on('change', () => {
			this._loadDirectoryTreeSync();
			this._loadRunnableList();
		});

		return await this._startWatcher();
	}

	public loadFile(filePath) {
		return new Promise((resolve, reject) => {
			winston.info(`Loading ${filePath}`);

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
			winston.info('save: ' + filePath);

			filePath = this._getFullPath(filePath);

			fs.writeFile(filePath, content, err => {
				if (err) return reject(err);

				resolve();
			});
		});
	}

	public rename(filePath, name) {
		return new Promise((resolve, reject) => {
			winston.info('rename: ' + filePath + ' to: ' + name);

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
			winston.info('delete: ' + filePath);

			filePath = this._getFullPath(filePath);

			rmdir(filePath, (err, data) => {
				if (err)
					return reject(err);

				// Delete from stored tree


				resolve();
			});
		});
	}

	public createFile(parent: string, name: string, content = '') {
		return new Promise(async (resolve, reject) => {
			winston.info('Create file: ' + name);

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
			winston.info('Create directory: ' + name);

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

	private _loadDirectoryTreeSync() {
		winston.info('Load directory tree');

		let tree = dirTree(this.app.controllers.config.config.path.custom);

		if (tree) {
			tree = tree.children;
			this._directoryTree = this._normalizeDirectoryTree(tree);
		}
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

	private async _compile(inputPath, outputPath) {

		return new Promise((resolve, reject) => {

			let gulpPath = path.join(__dirname, '..', 'node_modules', 'gulp', 'bin', 'gulp.js'),
				childOpt = {
					stdio: ['pipe', process.stdout, process.stderr, 'ipc'],
					cwd: path.join(__dirname, '../')
				}, child;

			child = fork(gulpPath, ['custom:build', `--input-path=${inputPath}`, `--output-path=${outputPath}`], childOpt);

			child.on('close', (code) => {
				console.log(`child process exited with code ${code}`);

				code ? reject(code) : resolve();
			});
		});
	}

	private _loadRunnableList() {
		let runnableList = {
			ea: [],
			indicator: [],
			template: []
		};

		this._directoryTree.forEach(obj => {
			if (runnableList.hasOwnProperty(obj.name))
				runnableList[obj.name].push(...obj.children.map(child => child.name));
		});

		this._runnableList = runnableList;

		this.emit('runnable-list:change', runnableList)
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
				winston.info('file:new', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f is a new file
			} else if (curr.nlink === 0) {
				winston.info('file:removed', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was removed
			} else {
				winston.info('file:changed', fileNames);
				this.emit('change')
				await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was changed
			}
		})
	}

	private _getFullPath(filePath): string {
		if (!filePath)
			throw new Error('No fileName given');

		let pathCustom = this.app.controllers.config.config.path.custom;
		return path.join(pathCustom, filePath);
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
