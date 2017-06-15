import * as win		from 'winston';
import * as path	from 'path';
import * as fs		from 'fs';
import * as mkdirp	from 'mkdirp';

const PATH_SERVER_LOG = path.join(__dirname, '..', '_logs/', 'server.log');

if (!fs.existsSync(PATH_SERVER_LOG)) {
	mkdirp.sync(PATH_SERVER_LOG);
}

export const winston = new win.Logger({
	transports: [
		new win.transports.File({
			level: 'info',
			filename: PATH_SERVER_LOG,
			json: false,
			maxsize: 5242880, // 5MB
			maxFiles: 2,
			colorize: false
		}).on('error', function(err) {
			console.error(err.stack);
		}),
		new win.transports.Console({
			level: 'debug',
			json: false,
			colorize: true
		})
	],
	exitOnError: false
});