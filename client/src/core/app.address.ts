import { environment } from '../environments/environment';
import DEV_OVERWRITE from '../address_overwrite';

declare let window: any;

const localIp = '127.0.0.1';
const androidEmulatorIp = '10.0.2.2';
const iosEmulatorIp = 'localhost';
const prodApiIp = '149.210.227.14';
const prodApiPort = 3100;
const prodWsType = 'wss';
const prodProtocol = 'http';

const address = {
	secure: true,
	host: location.protocol.replace(/:/g, ''),
	ip: location.hostname,
	port: parseInt(location.port, 10) || undefined,
	ws: '',
	hostUrl: '',
	apiUrl: ''
}

// APP
if (window.platform.isApp) {
	
	// EMULATOR
	if (window.platform.isEmulator && !environment.production) {

		// android emulator
		if (window.device.platform === 'Android') {
			address.ip = androidEmulatorIp;
		} 
		// ios emulator
		else {
			address.ip = iosEmulatorIp;
		}

		address.host = 'http';
		address.ws = 'ws';
		address.port = 4000;
	} 
	
	// REAL DEVICE
	else {
		address.ip = prodApiIp;
		address.host = prodProtocol;
		address.ws = prodWsType;
		address.port = prodApiPort;

		// merge custom app address options (for connecting from real device to dev machine in development)
		if (!environment.production && DEV_OVERWRITE.app) {
			Object.assign(address, DEV_OVERWRITE.app);
		}
	}
}

// construct full domain url
address.hostUrl = (address.host ? `${address.host}://` : '') + (address.ip + (address.port ? `:${address.port}` : ''));

// construct full api url
address.apiUrl = `${address.hostUrl}/api/v1/`;

export default address;