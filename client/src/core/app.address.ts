import { environment } from '../environments/environment';

declare let window: any;

const localIp = '127.0.0.1';
const androidEmulatorIp = '10.0.2.2';
const iosEmulatorIp = 'localhost';
const liveIp = 'coinpush.app';

export const getAddress = function () {
	let secure = true;
	let host: string = 'https';
	let ws: string;
	let ip: string;
	let port: number;

	if (window.platform.isApp) {
		if (window.platform.isEmulator && !environment.production) {
			if (window.device.platform === 'Android') {
				ip = androidEmulatorIp;
				host = 'http';
			} else {
				ip = iosEmulatorIp;
				host = 'http';
			}
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

	const hostUrl = (host ? `${host}://` : '') + (ip + (port ? `:${port}` : ''));
	const apiUrl = `${hostUrl}/api/v1/`;

	return { host, ip, port, hostUrl, apiUrl, ws, secure };
}