declare let window: any;

const localIp = '127.0.0.1';
const emulatorIp = '10.0.2.2';
const liveIp = 'frontend-freelance.com';

let secure = true;
let host: string = 'https';
let ws: string;
let ip: string;
let port: number;

if (window.platform.isApp) {
	if (window.platform.isEmulator) {
		ip = emulatorIp;
		host = 'http';
		ws = 'ws';
		port = 4000;
	} else {
		ip = liveIp;
		host = 'https';
		ws = 'wss';
		port = undefined;
	}
} else {
	ip = location.hostname;
	port = parseInt(location.port, 10) || undefined;
	host = location.protocol.replace(/:/g, '');
}

const hostUrl = host + '://' + (ip + (port ? ':' + port : ''));
const apiUrl = hostUrl + '/api/v1/';

export const getAddress = function () {
	return { host, ip, port, hostUrl, apiUrl, ws, secure};
}