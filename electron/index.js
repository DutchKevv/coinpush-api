'use strict';

if (process.env.NODE_ENV !== 'development') {
	process.env.NODE_ENV = 'production';
}

const
	path = require('path'),
	{fork} = require('child_process'),
	{app, BrowserWindow, Menu} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, server;

function startServer() {
	const TARGET = process.env.npm_lifecycle_event;
	const appDataPath = app.getPath(TARGET === 'test' ? 'temp' : 'appData');

	let serverConfig = {
		path: {
			config: path.join(appDataPath, '_config'),
			cache: path.join(appDataPath, '_cache'),
			custom: path.join(appDataPath, 'custom')
		}
	};

	server = fork(path.join(__dirname, '../server/bootstrapper.js'), [`--config=${JSON.stringify(serverConfig)}`], {
		env: {
			ELECTRON: true
		},
		stdio: [0, null, null, 'ipc']
	});

	// TODO: What to do with eror
	server.stderr.on('data', (data) => {
		console.error(data.toString());
	});

	server.stdout.on('data', (data) => {
		console.log(data.toString());
	});
}

function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		backgroundColor: '#2d2d2d',
		show: true,
		webPreferences: {
			webSecurity: false
		},
		width: 1200,
		height: 900
	});

	// win.setFullScreen(true);

	console.log('__dirname', path.join(__dirname, '..', 'client', 'dist').replace(/\\/g, "/") + '/index.html');

	if (process.env.NODE_ENV === 'development') {
		win.loadURL('http://localhost:4200');
		win.webContents.openDevTools();
	} else {
		win.loadURL(`file://${path.join(__dirname, '..', 'client', 'dist').replace(/\\/g, "/")}/index.html`);
		win.webContents.openDevTools();
		startServer();
	}

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	});

	win.on('open', () => {
		console.log('OPEN EOPFDSSDFSDFDF');

	});

	// Create the Application's page-main menu (Only Mac)
	if (require('os').platform() === 'darwin') {
		var template = [{
			label: "Application",
			submenu: [
				{label: "About Application", selector: "orderFrontStandardAboutPanel:"},
				{type: "separator"},
				{
					label: "Quit", accelerator: "Command+Q", click: function () {
					app.quit();
				}
				}
			]
		},
			{
				label: "Edit",
				submenu: [
					{label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:"},
					{label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:"},
					{type: "separator"},
					{label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:"},
					{label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:"},
					{label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:"},
					{label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:"}
				]
			}
		];

		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	}

	// const template = [
	//     {
	//         label: 'Edit',
	//         submenu: [
	//             {
	//                 role: 'undo'
	//             },
	//             {
	//                 role: 'redo'
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'cut'
	//             },
	//             {
	//                 role: 'copy'
	//             },
	//             {
	//                 role: 'paste'
	//             },
	//             {
	//                 role: 'pasteandmatchstyle'
	//             },
	//             {
	//                 role: 'delete'
	//             },
	//             {
	//                 role: 'selectall'
	//             }
	//         ]
	//     },
	//     {
	//         label: 'View',
	//         submenu: [
	//             {
	//                 role: 'reload'
	//             },
	//             {
	//                 role: 'toggledevtools'
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'resetzoom'
	//             },
	//             {
	//                 role: 'zoomin'
	//             },
	//             {
	//                 role: 'zoomout'
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'togglefullscreen'
	//             }
	//         ]
	//     },
	//     {
	//         role: 'window',
	//         submenu: [
	//             {
	//                 role: 'minimize'
	//             },
	//             {
	//                 role: 'close'
	//             }
	//         ]
	//     },
	//     {
	//         role: 'help',
	//         submenu: [
	//             {
	//                 label: 'Learn More',
	//                 click () {
	//                     require('electron').shell.openExternal('http://electron.atom.io')
	//                 }
	//             }
	//         ]
	//     }
	// ]
	//
	// if (process.platform === 'darwin') {
	//     template.unshift({
	//         label: app.getName(),
	//         submenu: [
	//             {
	//                 role: 'about'
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'services',
	//                 submenu: []
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'hide'
	//             },
	//             {
	//                 role: 'hideothers'
	//             },
	//             {
	//                 role: 'unhide'
	//             },
	//             {
	//                 type: 'separator'
	//             },
	//             {
	//                 role: 'quit'
	//             }
	//         ]
	//     })
	//     // Edit menu.
	//     template[1].submenu.push(
	//         {
	//             type: 'separator'
	//         },
	//         {
	//             label: 'Speech',
	//             submenu: [
	//                 {
	//                     role: 'startspeaking'
	//                 },
	//                 {
	//                     role: 'stopspeaking'
	//                 }
	//             ]
	//         }
	//     )
	//
	//     // Window menu.
	//     template[3].submenu = [
	//         {
	//             label: 'Close',
	//             accelerator: 'CmdOrCtrl+W',
	//             role: 'close'
	//         },
	//         {
	//             label: 'Minimize',
	//             accelerator: 'CmdOrCtrl+M',
	//             role: 'minimize'
	//         },
	//         {
	//             label: 'Zoom',
	//             role: 'zoom'
	//         },
	//         {
	//             type: 'separator'
	//         },
	//         {
	//             label: 'Bring All to Front',
	//             role: 'front'
	//         }
	//     ]
	// }

	// const menu = Menu.buildFromTemplate(template)
	// Menu.setApplicationMenu(menu)
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow();
	}
});

app.appPath = app.getAppPath();
app.init = true;
