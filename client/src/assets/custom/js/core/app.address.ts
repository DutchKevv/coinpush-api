import { app } from './app';

const localIp = '192.168.178.12';
const liveIp = '149.210.227.14';
const devLocalIp = '127.0.0.1';
const emulatorIp = '10.0.2.2';

let host: string = 'http:';
let ip: string = liveIp;
let port: number | string = 3100;

// dev environment
// if (!environment.production) {
// if (app.platform.isLocal) {
// 	if (app.platform.isEmulator) {
// 		ip = app.platform.isApp ? emulatorIp : devLocalIp;
// 	} else {
// 		ip = localIp;
// 	}

// }
// else {
// 	ip = location.hostname;
// 	port = location.port;
// 	host = location.protocol;
// }
// }


export const getAddress = function () {
	let apiUrl = '';

	if (app.platform.isApp) {
		if (app.platform.isEmulator) {
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

	return { ip, port, apiUrl };
}