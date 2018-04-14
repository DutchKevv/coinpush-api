const path = require('path');
const fs = require('fs');

let domain = {
    host: '0.0.0.0',
    apiUrl: 'http://0.0.0.0:4000',
    port: 4000
};

const config = {
    domain,
    path: {
        'custom': path.join(__dirname, 'custom'),
        'config': path.join(__dirname, '_config')
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
            connectionString: 'mongodb://mongodb:27017/tradejs-cache'
        },
        order: {
            port: 3005,
            connectionString: 'mongodb://mongodb:27017/tradejs-orders'
        },
        broker: {
            port: 3006,
        },
        user: {
            port: 3008,
            connectionString: 'mongodb://mongodb:27017/tradejs-user'
        },
        comment: {
            port: 3009,
            connectionString: 'mongodb://mongodb:27017/tradejs-comment'
        },
        notify: {
            port: 3010,
            connectionString: 'mongodb://mongodb:27017/tradejs-notify'
        },
        event: {
            connectionString: 'mongodb://mongodb:27017/tradejs-event',
            port: 3011,
        },
        fe: {
            port: 4200,
        }
    },
    image: {
        maxUploadSize: 10 * 1024 * 1024,
        profilePath: path.join(__dirname, 'images', 'profile'),
        profileBaseUrl: '/images/profile/',
        profileDefaultPath: path.join(__dirname, 'images', 'default', 'profile', 'nl.png'),
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
        devLocal: "0.0.0.0",
        devApp: "10.0.2.2"
    },
    firebase: {
        key: "" // Your firebase accound id (push messages)
    },
    port: 4000,
    app: {
        version: "0.0.1",
        ip: {
            local: '0.0.0.0', 
            appEmulator: '10.0.2.2',
            live: '**',
        }
    },
    auth: {
        jwt: {
            secret: 'BUTTERFLY1942',
            passwordResetSecret: 'BEAVER_COMMUNITY_12_1'
        },
        facebook: {
            clientID      : '178901869390909', // your App ID
            clientSecret  : 'be8d6625e76a24899b2585d65d3522c1', // your App Secret
            'callbackURL'   : 'http://localhost:8080/auth/facebook/callback',
            'profileURL'    : 'https://graph.facebook.com/v2.12/me?fields=first_name,last_name,email',
            'profileFields' : ['id', 'email', 'name'] // For requesting permissions from Facebook API
        }
    }
};

// deepmerge config with custom config
try {
    if (fs.existsSync(path.join(__dirname, 'tradejs.config.custom.js'))) {
        mergeDeep(config, require('./tradejs.config.custom'));
    } else {
        console.error('WARNING: missing \'tradejs.config.custom.js\'! \n');
    }     
} catch (error) {
    console.error('WARNING: corrupt \'tradejs.config.custom.js\'! \n');
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