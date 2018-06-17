const 
    path    = require('path'),
    fs      = require('fs');

const
    ENV_PRODUCTION = (process.env.NODE_ENV || '').startsWith('prod'),
    PATH_CONFIG_CUSTOM = path.join(__dirname, 'coinpush.config.custom.js');

// let domain = {
//     host: '0.0.0.0',
//     apiUrl: 'http://0.0.0.0:4000',
//     port: 4000
// };

// if (ENV_PRODUCTION) {
//     domain = {
//         host: 'coinpush.app',
//         apiUrl: 'https://coinpush.app'
//     };
// }

const config = {
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
        maxUploadSize: 1024 * 1024 * 10, // 1024=(1KB) * 1024=(1MB) * 10 = 10MB
        profilePath: path.join(__dirname, '../static/image/profile'),
        profileBaseUrl: '/image/profile/',
        profileDefaultPath: path.join(__dirname, '../static/image/default/profile/nl.png'),
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
    auth: {
        jwt: {
            secret: '',
            passwordResetSecret: ''
        },
        facebook: {
            clientID: '', // your App ID
            clientSecret: '', // your App Secret
            callbackURL: 'http://localhost:8080/auth/facebook/callback',
            profileURL: 'https://graph.facebook.com/v2.12/me?fields=first_name,last_name,email',
            profileFields: ['id', 'email', 'name'] // For requesting permissions from Facebook API
        }
    }
};

// deepmerge config with custom config
if (fs.existsSync(PATH_CONFIG_CUSTOM)) {
    try {
        mergeDeep(config, require(PATH_CONFIG_CUSTOM));
    } catch (error) {
        console.error('WARNING: corrupt \'coinpush.config.custom.js\'! \n');
        throw error;
    }
} else {
    console.warn('WARNING: missing \'coinpush.config.custom.js\' in the _config directory! \n');
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
    return item !== null && typeof item === 'object' && !Array.isArray(item);
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

module.exports.config = config;