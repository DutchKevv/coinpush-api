import * as fs      from 'fs';
import * as watch 	from 'watch';
import * as path 	from 'path';
import * as ts 		from 'typescript';
import * as mkdirp  from 'mkdirp';
import * as dirTree from 'directory-tree';
import * as rmdir  	from 'rmdir';
import WorkerChild 	from '../worker/WorkerChild';
import {log} 		from '../../../shared/logger';

export default class Editor extends WorkerChild {

	public options: {rootPath: string};

	private _runnableList = {};
	private _directoryTree = [];
	private _compilerOptions: ts.CompilerOptions = {
		'alwaysStrict': true,
		'experimentalDecorators': true,
		'emitDecoratorMetadata': true,
		'target': 4, // 'es2017',
		'sourceMap': true,
		'module': 1, // CommonJS,
		'moduleResolution': 2, // 'Node',
		'baseUrl': '.',
		'allowJs': true,
		'paths': {
			'tradejs/ea': ['../server/classes/ea/EA'],
			// 'tradejs/indicator/*': [path.join(__dirname, '../../shared/indicators/*')],
			// 'tradejs/indicator': [path.join(__dirname, '../../shared/indicators/Indicator')]
		},
		'types' : [
			'core-js',
			'node'
		],
		'typeRoots': [
			path.join(__dirname, '../node_modules/@types')
		]
	};

	async init() {
		await super.init();

		// Ensure path to custom folder exists and it has ea, indicator, templates folder inside
		mkdirp.sync(this.options.rootPath);
		mkdirp.sync(path.join(this.options.rootPath, 'ea'));
		mkdirp.sync(path.join(this.options.rootPath, 'indicator'));
		mkdirp.sync(path.join(this.options.rootPath, 'templates'));

		// Load the directory tree into memory
		this._loadDirectoryTreeSync();
		this._loadRunnableList();

		// TODO - Do not load list with every change!
		this.on('change', () => {
			this._loadDirectoryTreeSync();
			this._loadRunnableList();
		});

		this._setIPCListeners();

		this._watch();
	}

	public loadFile(filePath) {
		return new Promise((resolve, reject) => {
			log.info('Editor', `Loading ${filePath}`);

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
			log.info('Editor', 'save ' + filePath);

			filePath = this._getFullPath(filePath);

			fs.writeFile(filePath, content, err => {
				if (err) return reject(err);

				resolve();
			});
		});
	}

	public rename(filePath, name) {
		return new Promise((resolve, reject) => {
			log.info('Editor', 'rename: ' + filePath + ' to: ' + name);

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
			log.info('Editor', 'delete: ' + filePath);

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
			log.info('Editor', 'Create file: ' + name);

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
			log.info('Editor', 'Create directory: ' + name);

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

	private _watch() {
		watch.watchTree(this.options.rootPath, async (fileNames, curr, prev) => {
			if (typeof fileNames === 'object' && prev === null && curr === null) {
				let paths = Object.keys(fileNames);

				// console.log(paths);
				// console.log(paths[0]);

				// Finished walking the tre
				// console.log('asdasdasd', fileNames);
				this.emit('change');
			} else if (prev === null) {
				log.info('file:new', fileNames);
				this.emit('change');
				this.compile(fileNames);
				// f is a new file
			} else if (curr.nlink === 0) {
				log.info('file:removed', fileNames);
				this.emit('change');
				this.compile(fileNames);

				// await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was removed
			} else {
				log.info('file:changed', fileNames);
				this.emit('change');
				this.compile(fileNames);

				// await this._compile(this._getCustomAbsoluteRootFolder(fileNames), this._getBuildAbsoluteRootFolder(fileNames));
				// f was changed
			}
		})
	}

	async unWatch() {

	}

	async compile(filePath) {
		if (this._isCompileWorthy(filePath) === false)
			return;

		try {
			let input = path.join(this._getAbsoluteInputFolder(filePath), 'index.ts');
			let errors = [];

			let program = ts.createProgram([input], this._compilerOptions);
			// console.log(program.getRootFileNames());
			// console.log(program.getSourceFiles());
			let emitResult = program.emit();

			let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
			console.log(allDiagnostics);

			allDiagnostics.forEach(diagnostic => {
				// console.log(diagnostic);
				let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
				let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

				errors.push({
					message: `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${diagnostic.messageText}`
				});

				// console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
			});

			if (errors.length) {

			} else {

			}

			let success = !emitResult.emitSkipped;
			this.ipc.send('main', 'compile-result', {errors: errors}, false)
		} catch (error) {
			this.ipc.send('main', 'compile-result', {errors: [error]}, false)
		}
	}

	private _setIPCListeners() {
		this.ipc.on('file:load', async (data, cb) => {
			try {
				cb(null, await this.loadFile(data.id));
			} catch (error) {
				log.error('Editor', error);
				cb(error);
			}
		});

		this.ipc.on('file:save', async (data, cb) => {
			try {
				cb(null, await this.save(data.id, data.content));
			} catch (error) {
				log.error('Editor', error);
				cb(error);
			}
		});

		this.ipc.on('file:create', async (data, cb) => {
			try {
				cb(null, await this.createFile(data.parent, data.name));
			} catch (error) {
				console.error(error);
				cb(error);
			}
		});

		this.ipc.on('file:delete', async (data, cb) => {
			try {
				cb(null, await this.delete(data.id));
			} catch (error) {
				log.error('Editor', error);
				cb(error);
			}
		});

		this.ipc.on('file:rename', async (data, cb) => {
			try {
				cb(null, await this.rename(data.id, data.name));
			} catch (error) {
				log.error('Editor', error);
				cb(error);
			}
		});

		this.ipc.on('file:copy', async (data, cb) => {

		});

		this.ipc.on('file:move', async (data, cb) => {

		});

		this.ipc.on('directory:create', async (data, cb) => {
			try {
				cb(null, await this.createDirectory(data.id, data.name));
			} catch (error) {
				log.error('Editor', error);
				cb(error);
			}
		});
	}

	private _loadDirectoryTreeSync() {
		log.info('Editor', 'Load directory tree');

		let tree = dirTree(this.options.rootPath);

		if (tree) {
			tree = tree.children;
			this._directoryTree = this._normalizeDirectoryTree(tree);
		}

		this.ipc.send('main', 'directory-list', this._directoryTree, false);
	}

	private _normalizeDirectoryTree(arr: any): Array<any> {
		for (let i = 0, len = arr.length, node; i < len; i++) {
			node = arr[i];

			node.id = node.path.replace(this.options.rootPath, '');
			node.isFile = !node.children;

			if (node.children)
				this._normalizeDirectoryTree.call(this, node.children);
		}

		return arr;
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

		this.ipc.send('main', 'runnable-list', runnableList, false);
	}

	// TODO - Hacky
	private _getAbsoluteInputFolder(filePath) {
		let fileDirs = filePath.split(path.sep);
		let customDirs = this.options.rootPath.split(path.sep);

		fileDirs.splice(customDirs.length + 2);

		let result = fileDirs.join(path.sep);

		return result;
	}

	private _getFullPath(filePath): string {
		if (!filePath)
			throw new Error('No fileName given');

		let pathCustom = this.options.rootPath;
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

	private _isCompileWorthy(filePath) {
		let file = path.parse(filePath),
			tsFile = path.join(file.dir, path.basename(filePath, file.ext) + '.ts');

		if (['.ts', '.js', '.json'].indexOf(file.ext) === -1)
			return false;

		if (file.ext === '.js' && fs.existsSync(tsFile)) {
			return false;
		}

		return true;
	}
}