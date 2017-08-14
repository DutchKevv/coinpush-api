"use strict";

const url = require('url');
const path = require('path');
const express = require('express');
const httpProxy = require('express-http-proxy');
const expressJwt = require('express-jwt');
const config = require('../config.json');
const app = express();
const morgan = require('morgan');
const helmet = require('helmet');
const request = require('request-promise');
const {json, urlencoded} = require('body-parser');

const URL_BASIC_API = 'http://localhost:3000';
const URL_CACHE_API = 'http://localhost:3001';
const URL_SOCIAL_API = 'http://localhost:3002';
const URL_USER_API = 'http://localhost:3003';
const URL_NEWS_API = 'http://localhost:3004';
const URL_ORDER_API = 'http://localhost:3005';
const URL_MESSAGE_API = 'http://localhost:3000';
const URL_FE_DEV_API = 'http://localhost:3000';

const PATH_PUBLIC_PROD = path.join(__dirname, '../../client/dist');
const PATH_PUBLIC_DEV = path.join(__dirname, '../../client/dist');
const PATH_IMAGES_PROD = path.join(__dirname, '../../images');
const PATH_IMAGES_DEV = path.join(__dirname, '../../images');

const apiServiceProxy = httpProxy(URL_BASIC_API);
const cacheServiceProxy = httpProxy(URL_CACHE_API);
const socialServiceProxy = httpProxy(URL_SOCIAL_API);
const userServiceProxy = httpProxy(URL_USER_API);
const newsServiceProxy = httpProxy(URL_NEWS_API);
const orderServiceProxy = httpProxy(URL_ORDER_API);
const scriptRunnerServiceProxy = httpProxy('http://localhost:3006');
const scriptBuilderProxy = httpProxy('http://localhost:3007');
const frontendDevServiceProxy = httpProxy(URL_FE_DEV_API);

app.use(morgan('dev'));
app.use(helmet());
// app.use(json());

app.use(express.static(process.env.NODE_ENV === 'production' ? PATH_PUBLIC_PROD : PATH_PUBLIC_DEV));
app.use(express.static(process.env.NODE_ENV === 'production' ? PATH_IMAGES_PROD : PATH_IMAGES_DEV));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// use JWT auth to secure the api, the token can be passed in the authorization header or query string
app.use(expressJwt({
    secret: config.secret,
    getToken (req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
            return req.headers.authorization.split(' ')[1];

        return null;
    }
}).unless(function(req) {
    return (
        (/\.(gif|jpg|jpeg|tiff|png)$/i).test(req.originalUrl) ||
        req.originalUrl === '/' ||
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
    if (req.user)
        req.headers._id = req.user.sub;

    next();
});

app.get('/', (req, res, next) => {
    frontendDevServiceProxy(req, res, next);
});

app.get('/images/*', (req, res, next) => {
    frontendDevServiceProxy(req, res, next);
});

app.all('/social/authenticate', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.all('/social/user', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.all('/social/user/*', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.get('/social/users', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.post('/social/file-upload/*', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.post('/social/follow/*', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.get('/order', (req, res, next) => {
    orderServiceProxy(req, res, next);
});

app.post('/order', async (req, res) => {

    const params = req.body;
    params.users = [req.user.id];

    try {
        // Place order
        const order = await request({
            method: 'POST',
            uri: url.resolve(URL_ORDER_API, 'order'),
            headers: {'_id': req.user.sub},
            json: params
        });
        res.send(order);
    } catch (error) {
        res.status(error.statusCode).send(error.error.message);
        return;
    }


    // Get followers and call orders again for all followers
    try {
        const result = await request({
            uri: url.resolve(URL_SOCIAL_API, 'social/user'),
            headers: {'_id': req.user.sub},
            json: {
                fields: ['followers']
            }
        });

        if (result.followers.length) {

            params.users = result.followers;

            await request({
                method: 'POST',
                uri: url.resolve(URL_ORDER_API, 'order'),
                headers: {'_id': req.user.sub},
                json: params
            });
        }
    } catch (error) {
        console.log('FOLLOWERS ERROR: ', error);
    }
});

app.get('/orders', async (req, res, next) => {
    orderServiceProxy(req, res, next);
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


//
// app.post('/social/users', (req, res, next) => {
//     socialServiceProxy(req, res, next);
// });
//
// app.use((err, req, res, next) => {
//     res.status(404).send('url not found!');
//     next()
// });

app.listen(80, () => {
    console.log('Gateway listening on port : 80');
});