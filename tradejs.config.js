const path = require('path');

let domain = {
    host: 'http://localhost',
    apiUrl: 'http://localhost:3100',
    port: 3100
};

const config = {
    domain,
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
            protocol: 'https'
        },
        oldApi: {
            port: 3000,
        },
        cache: {
            port: 3001,
            connectionString: 'mongodb://localhost:27017/tradejs-cache'
        },
        order: {
            port: 3005,
            connectionString: 'mongodb://localhost:27017/tradejs-orders'
        },
        broker: {
            port: 3006,
        },
        channel: {
            port: 3007,
            connectionString: 'mongodb://localhost:27017/tradejs-channels'
        },
        user: {
            port: 3008,
            connectionString: 'mongodb://localhost:27017/tradejs-user'
        },
        comment: {
            port: 3009,
            connectionString: 'mongodb://localhost:27017/tradejs-comment'
        },
        notify: {
            port: 3010,
            connectionString: 'mongodb://localhost:27017/tradejs-notify'
        },
        event: {
            connectionString: 'mongodb://localhost:27017/tradejs-event',
            port: 3011,
        },
        fe: {
            port: 4200,
        }
    },
    image: {
        maxUploadSize: 10 * 1024 * 1024,
        profilePath: path.join(__dirname, 'images', 'images', 'profile'),
        profileBaseUrl: '/images/profile/',
        profileDefaultPath: path.join(__dirname, 'images', 'images', 'default', 'profile', 'nl.png'),
        profileDefaultUrl: '/images/default/profile/nl.png'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        key: {
            user: 'user_'
        }

    },
    broker: {
        oanda: {
            'environment': '', // Your environment
            'username': '', // Your username
            'token': '', // Your oanda token
            'accountId': '' // Your account id
        }
    },
    email: {
        account: {
            noReply: {
                service: 'Gmail',
                auth: {
                    user: '**', // Your email id
                    pass: '**' // Your password
                }
            }
        }
    },
    ip: {
        local: "",
        prod: "",
        devLocal: "127.0.0.1",
        devApp: "10.0.2.2"
    },
    firebase: {
        key: "" // Your firebase accound id (push messages)
    },
    port: 3100,
    app: {
        version: "0.0.1",
        ip: {
            local: '192.168.178.12',
            live: '149.210.227.14',
            devLocal: '127.0.0.1',
            devApp: '10.0.2.2'
        }
    }
};

// deepmerge config with custom config
mergeDeep(config, require('./tradejs.config.custom.json'));

// build full domain urls (ex: http://123.123.123.123:9999)
for (let name in config.server)
    config.server[name].apiUrl = domain.host + ':' + config.server[name].port;

/**
 * Simple is object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 * Deep merge two objects.
 * @param target
 * @param source
*/
function mergeDeep(target, source) {
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        });
    }
    return target;
}

module.exports = config;