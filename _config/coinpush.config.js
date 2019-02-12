const path    = require('path')

const ENV_PRODUCTION = (process.env.NODE_ENV || '').startsWith('prod');

let domain = {
    host: 'localhost',
    apiUrl: 'https://localhost',
};

if (ENV_PRODUCTION) {
    domain = {
        host: 'coinpush.app',
        apiUrl: 'https://coinpush.app'
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
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-cache?authSource=admin'
        },
        order: {
            port: 3005,
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-orders?authSource=admin'
        },
        broker: {
            port: 3006,
        },
        user: {
            port: 3008,
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-user?authSource=admin'
        },
        comment: {
            port: 3009,
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-comment?authSource=admin'
        },
        notify: {
            port: 3010,
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-notify?authSource=admin'
        },
        event: {
            connectionString: 'mongodb://root:example@mongodb:27017/coinpush-event?authSource=admin',
            port: 3011,
        }
    },
    image: {
        maxUploadSize: 1024 * 1024 * 10, // 1024=(1KB) * 1024=(1MB) * 10 = 10MB
        profilePath: path.join(__dirname, '../static/image/profile'),
        profileBaseUrl: '/image/profile/',
        profileDefaultPath: path.join(__dirname, '../static/image/default/profile/nl.png'),
        profileDefaultUrl: 'assets/image/default-profile.jpg'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        key: {
            user: 'user_'
        }

    },
    brokers: {
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
    push: {
        firebase: {
            key: "AAAAcOdrZII:APA91bHdt3bPaqUW4sWF7tht0xJs13B_X-4Svm4TlWeLnXXFoVsPxWRQGxUPdqudCP1OHkQ-IJCVO10DJKi8G2fLekqfpy0xAXGakQmj-7FZW3DwB18BxcHNIWlgNC9T3T1tbXEnbaxM"
        },
    },
    ip: {
        "local": "127.0.0.1",
        "prod": "www.coinpush.app",
        "devLocal": "127.0.0.1",
        "devApp": "10.0.2.2"
    },
    auth: {
        jwt: {
            secret: 'liefmeisje',
            passwordResetSecret: 'liefmeisje'
        },
        facebook: {
            clientID: '391706548256074', // your App ID
            clientSecret: '339944e9235cd77f9f8d133ae23a519a ', // your App Secret
            callbackURL: 'http://localhost:4200/auth/facebook/callback',
            profileURL: 'https://graph.facebook.com/v2.12/me?fields=first_name,last_name,email',
            profileFields: ['id', 'email', 'name'] // For requesting permissions from Facebook API
        }
    },
    clientVersion: "0.0.1"
};

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