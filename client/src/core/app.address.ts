declare let window: any;

const localIp = '192.168.178.12';
const liveIp = '149.210.227.14';
const devLocalIp = '127.0.0.1';
const emulatorIp = '10.0.2.2';

let secure = true;
let host: string = 'https:';
let ws: string = 'wss:';
let ip: string = liveIp;
let port: number | string = 3100;
let apiUrl = '';

if (window.platform.isApp) {
	if (window.platform.isEmulator) {
		ip = emulatorIp;
	} else {

	}

	apiUrl = host + '//' + (ip + (port ? ':' + port : '')) + '/api/v1/';
} else {
	ip = location.hostname;
	port = location.port;
	host = location.protocol;
	apiUrl = '/api/v1/';
}

export const getAddress = function () {
	return { host, ip, port, apiUrl, ws, secure};
}