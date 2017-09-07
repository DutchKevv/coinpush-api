"use strict";

const url = require('url');
const path = require('path');
const express = require('express');
const httpProxy = require('http-proxy');
const expressJwt = require('express-jwt');
const config = require('../../tradejs.config');
const app = express();
const morgan = require('morgan');
const helmet = require('helmet');
const request = require('request-promise');
const {raw, urlencoded} = require('body-parser');

const PATH_PUBLIC_PROD = path.join(__dirname, '../../client/dist');
const PATH_PUBLIC_DEV = path.join(__dirname, '../../client/dist');
const PATH_IMAGES_PROD = path.join(__dirname, '../../images');
const PATH_IMAGES_DEV = path.join(__dirname, '../../images');

const proxy = httpProxy.createProxyServer({});

app.use(morgan('dev'));
app.use(helmet());
app.use(urlencoded({extended: false}));

app.use(express.static(process.env.NODE_ENV === 'production' ? PATH_PUBLIC_PROD : PATH_PUBLIC_DEV));
app.use(express.static(process.env.NODE_ENV === 'production' ? PATH_IMAGES_PROD : PATH_IMAGES_DEV));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// use JWT auth to secure the api, the token can be passed in the authorization header or query string
app.use(expressJwt({
    secret: config.server.gateway.secret,
    getToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
            return req.headers.authorization.split(' ')[1];

        return null;
    }
}).unless(function (req) {
    return (
        (/\.(gif|jpg|jpeg|tiff|png)$/i).test(req.originalUrl) ||
        req.originalUrl === '/' ||
        req.originalUrl.indexOf('/sounds/') > -1 ||
        (req.originalUrl === '/social/authenticate' && (req.method === 'POST' || req.method === 'OPTIONS')) ||
        (req.originalUrl === '/social/user' && (req.method === 'POST' || req.method === 'OPTIONS'))
    );
}));


app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).send('invalid token...');
    }

    next();
});

app.use(function (req, res, next) {
    if (req.user) {
        req.user.id = req.user.sub;
        req.headers._id = req.user.sub;
    }
    next();
});

app.get('/', (req, res) => {
    proxy.web(req, res, {target: config.server.fe.apiUrl});
});

app.get('/images/*', (req, res) => {
    proxy.web(req, res, {target: config.server.fe.apiUrl});
});

app.all('/social/authenticate', (req, res) => {
    proxy.web(req, res, {target: config.server.social.apiUrl});
});

app.all('/social/user/:id?', (req, res) => {
    if (!req.params.id && req.method !== 'POST') {
        let pieces = url.parse(req.url);
        req.url = url.resolve(pieces.pathname + '/', req.user.id + '/') + (pieces.search || '');
    }
    proxy.web(req, res, {target: config.server.social.apiUrl});
});

app.get('/social/users', (req, res) => {
    proxy.web(req, res, {target: config.server.social.apiUrl});
});

app.post('/social/file-upload/*', (req, res) => {
    proxy.web(req, res, {target: config.server.social.apiUrl});
});

app.post('/social/follow/*', (req, res) => {
    proxy.web(req, res, {target: config.server.social.apiUrl});
});

app.all('/order', (req, res) => {
    proxy.web(req, res, {target: config.server.broker.apiUrl});
});

// app.post('/order', async (req, res) => {
//     proxy.web(req, res, {target: URL_ORDER_API});

    // // console.log(req);
    // const params = JSON.parse(req.rawBody);
    // params.users = [req.user.sub];
    //
    // try {
    //     // Place order
    //     const order = await request({
    //         method: 'POST',
    //         uri: url.resolve(URL_ORDER_API, 'order'),
    //         headers: {'_id': req.user.sub},
    //         json: params
    //     });
    //     res.send(order[0]);
    // } catch (error) {
    //     res.status(error.statusCode).send(error.error.message);
    //     return;
    // }
    //
    //
    // // Get followers and call orders again for all followers
    // try {
    //     const result = await request({
    //         uri: url.resolve(URL_SOCIAL_API, 'social/user'),
    //         headers: {'_id': req.user.sub},
    //         qs: {
    //             fields: ['followers']
    //         },
    //         json: true
    //     });
    //     if (result.followers.length) {
    //
    //         params.users = result.followers;
    //
    //         await request({
    //             method: 'POST',
    //             uri: url.resolve(URL_ORDER_API, 'order'),
    //             headers: {'_id': req.user.sub},
    //             json: params
    //         });
    //     }
    // } catch (error) {
    //     console.log('FOLLOWERS ERROR: ', error);
    // }
// });

app.get('/orders', async (req, res) => {
    proxy.web(req, res, {target: config.server.broker.apiUrl});
});

app.get('/search', (req, res, next) => {
    next();
});

app.get('/search/:text', async (req, res) => {
    const text = req.params.text;
    const returnObj = {
        users: [],
        channels: [],
        symbols: []
    };

    try {
        const userRequest = request({
            uri: 'http://localhost:3002/social/search/' + text,
            headers: {
                '_id': req.user.sub
            },
            json: false
        });

        const results = await Promise.all([userRequest]);
        returnObj.users = results[0];
        returnObj.channels = results[1];
        returnObj.symbols = results[2];
    } catch (error) {
        console.error(error);

        res.status(500).send(error);
        return;
    }

    res.send(returnObj);
});

app.listen(config.server.gateway.port, () => {
    console.log('Gateway listening on port : ' + config.server.gateway.port);
});