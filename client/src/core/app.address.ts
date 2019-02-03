import { environment } from '../environments/environment';
import DEV_OVERWRITE from '../address_overwrite';

declare let window: any;

const androidEmulatorIp = '10.0.2.2';
const iosEmulatorIp = 'localhost';
const localApiIp = '127.0.0.1';
const localApiPort = 3100;
const localApiWsType = 'ws';
const localApiProtocol = 'http';
const prodApiIp = 'www.coinpush.app';
const prodApiPort = undefined;
const prodApiWsType = 'wss';
const prodApiProtocol = 'https';

const address = {
	secure: true,
	host: localApiProtocol,
	ip: localApiIp,
	port: localApiPort,
	ws: localApiWsType,
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
	}

	// REAL DEVICE
	else {
		address.ip = prodApiIp;
		address.host = prodApiProtocol;
		address.ws = prodApiWsType;
		address.port = prodApiPort;

		// merge custom app address options (for connecting from real device to dev machine in development)
		if (!environment.production && DEV_OVERWRITE.app) {
			Object.assign(address, DEV_OVERWRITE.app);
		}
	}
}
else if (environment.production) {
	address.ip = prodApiIp;
	address.host = prodApiProtocol;
	address.ws = prodApiWsType;
	address.port = prodApiPort;
}

// construct full domain url
address.hostUrl = (address.host ? `${address.host}://` : '') + (address.ip + (address.port ? `:${address.port}` : ''));

// construct full api url
address.apiUrl = `${address.hostUrl}/api/v1/`;

export default address;