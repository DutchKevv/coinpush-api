import { environment } from "../environments/environment";

const localIp = '192.168.178.12';
const liveIp = '149.210.227.14';
const devLocalIp = '127.0.0.1';
const devAppIp = '10.0.2.2';

// live environment
let host: string = 'http:';
let ip: string = liveIp;
let port: number | string = 3100;

declare let window: any;

// dev environment
if (!environment.production) {
	if (window.AppConfig.isLocal) {
		if (window.AppConfig.isEmulator) {
			ip = window.AppConfig.isApp ? devAppIp : devLocalIp;
		} else {
			ip = localIp;
		}
		
	}
	else {
		ip = location.hostname;
		port = location.port;
		host = location.protocol;
	}
}

const apiUrl = host + '//' + (ip + (port ? ':' + port : '')) + '/api/v1/';

export const appConfig = {
	ip,
	port,
	apiUrl
};