import { environment } from "../environments/environment";

const isApp = !!window['_cordovaNative'];
const isLocal = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1; // This also triggers in browser
// const isApp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1; // This also triggers in browser
const liveIp = '149.210.227.14';
const devLocalIp = '127.0.0.1';
const devAppIp = '10.0.2.2';

// live environment
let host: string = 'http://';
let ip: string = liveIp;
let port: number | string = 3100;

// dev environment
if (!environment.production) {
	if (isLocal) {
		ip = isApp ? devAppIp : devLocalIp;
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