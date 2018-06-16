const path = require('path');
const fs = require('fs');

let domain = {
    host: '0.0.0.0',
    apiUrl: 'http://0.0.0.0:4000',
    port: 4000
};

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
    domain = {
        host: 'coinpush.app',
        apiUrl: 'https://coinpush.app',
        port: 4000
    };
}

const config = {
    domain,
    server: {
        gateway: {
            port: 3100
        },
        oldApi: {
            port: 3000,
        },
        cache: {
            port: 3001,
            connectionString: 'mongodb://mongodb:27017/coinpush-cache'
        },
        order: {
            port: 3005,
            connectionString: 'mongodb://mongodb:27017/coinpush-orders'
        },
        broker: {
            port: 3006,
        },
        user: {
            port: 3008,
            connectionString: 'mongodb://mongodb:27017/coinpush-user'
        },
        comment: {
            port: 3009,
            connectionString: 'mongodb://mongodb:27017/coinpush-comment'
        },
        notify: {
            port: 3010,
            connectionString: 'mongodb://mongodb:27017/coinpush-notify'
        },
        event: {
            connectionString: 'mongodb://mongodb:27017/coinpush-event',
            port: 3011,
        },
        fe: {
            port: 4200,
        }
    },
    image: {
        maxUploadSize: 10 * 1024 * 1024,
        profilePath: path.join(__dirname, 'static/image/profile'),
        profileBaseUrl: '/image/profile/',
        profileDefaultPath: path.join(__dirname, 'static/image/default/profile/nl.png'),
        profileDefaultUrl: '/assets/image/default-profile.jpg'
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
                host: '',
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: '', // generated ethereal user
                    pass: '' // generated ethereal password
                }
            }
        }
    },
    ip: {
        local: "",
        prod: "",
        devLocal: "0.0.0.0",
        devApp: "10.0.2.2"
    },
    firebase: {
        key: "" // Your firebase accound id (push messages)
    },
    ip: {
        "local": "127.0.0.1",
        "prod": "",
        "devLocal": "127.0.0.1",
        "devApp": "10.0.2.2"
    },
    port: 4000,
    auth: {
        jwt: {
            secret: '',
            passwordResetSecret: ''
        },
        facebook: {
            clientID      : '', // your App ID
            clientSecret  : '', // your App Secret
            'callbackURL'   : 'http://localhost:8080/auth/facebook/callback',
            'profileURL'    : 'https://graph.facebook.com/v2.12/me?fields=first_name,last_name,email',
            'profileFields' : ['id', 'email', 'name'] // For requesting permissions from Facebook API
        }
    }
};

// deepmerge config with custom config
try {
    if (fs.existsSync(path.join(__dirname, 'coinpush.config.custom.js'))) {
        mergeDeep(config, require('./coinpush.config.custom'));
    } else {
        console.error('WARNING: missing \'coinpush.config.custom.js\'! \n');
    }     
} catch (error) {
    console.error('WARNING: corrupt \'coinpush.config.custom.js\'! \n');
    throw error;
}

// build full domain urls (ex: http://123.123.123.123:9999)
for (let name in config.server)
    config.server[name].apiUrl = 'http://' + name + ':' + config.server[name].port;

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