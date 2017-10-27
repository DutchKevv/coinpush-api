const path = require('path');

module.exports = {
    system: {
        'port': 3000,
        'timezone': 'America/New_York'
    },
    path: {
        'custom': path.join(__dirname, 'custom'),
        'config': path.join(__dirname, '_config')
    },
    token: {
        secret: 'BUTTERFLY1942',
		passwordResetSecret: 'BEAVER_COMMUNITY_12_1'
    },
    server: {
        gateway: {
            port: 3100,
            apiUrl: 'http://localhost:3100'
        },
        oldApi: {
            port: 3000,
            apiUrl: 'http://localhost:3000'
        },
        cache: {
            port: 3001,
            apiUrl: 'http://localhost:3001',
            connectionString: 'mongodb://localhost:27017/tradejs-cache'
        },
        order: {
            port: 3005,
            apiUrl: 'http://localhost:3005',
            connectionString: 'mongodb://localhost:27017/tradejs-orders'
        },
        broker: {
            port: 3006,
            apiUrl: 'http://localhost:3006'
        },
        channel: {
            port: 3007,
            apiUrl: 'http://localhost:3007',
            connectionString: 'mongodb://localhost:27017/tradejs-channels'
        },
        user: {
            port: 3008,
            apiUrl: 'http://localhost:3008',
            connectionString: 'mongodb://localhost:27017/tradejs-user'
        },
		comment: {
			port: 3009,
			apiUrl: 'http://localhost:3009',
			connectionString: 'mongodb://localhost:27017/tradejs-comment'
		},
		email: {
			port: 3010,
			apiUrl: 'http://localhost:3010',
			connectionString: 'mongodb://localhost:27017/tradejs-email'
		},
        fe: {
            port: 4200,
            apiUrl: 'http://localhost:4200'
        }
    },
    image: {
        profilePath: path.join(__dirname, 'images', 'images', 'profile'),
		profileBaseUrl: '/images/profile/',
		profileDefaultPath: path.join(__dirname, 'images', 'images', 'default', 'profile', 'nl.png'),
		profileDefaultUrl: '/images/default/profile/nl.png',
        channelPath: path.join(__dirname, 'images', 'images', 'channel'),
        channelBaseUrl: '/images/profile/',
        channelDefaultPath: path.join(__dirname, 'images', 'images', 'default', 'profile', 'nl.png'),
        channelDefaultUrl: '/images/default/channel/channel.jpeg'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        key: {
            user: 'user_'
        }

    },
    broker: {
        account: {
            'broker': 'oanda',
            'environment': '',
            'username': null,
            'token': '067331173f67faf3cef7e69263a3015a-fefb596cddfe98d2f24e9ca843c3c443',
            'accountId': '1218398'
        }
    },
    email: {
        account: {
            noReply: {
				service: 'Gmail',
				auth: {
					user: 'brandsma1987@gmail.com', // Your email id
					pass: 'halo33221' // Your password
				}
            }
        }
    }
};