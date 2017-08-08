const url = require('url');
const path = require('path');
const express = require('express');
const httpProxy = require('express-http-proxy');
const expressJwt = require('express-jwt');
const config = require('../config.json');
const app = express();
const request = require('request-promise');

const apiServiceProxy = httpProxy('http://localhost:3000');
const frontendDevServiceProxy = httpProxy('http://localhost:4200');
const cacheServiceProxy = httpProxy('http://localhost:3001');
const socialServiceProxy = httpProxy('http://localhost:3002');
const userServiceProxy = httpProxy('http://localhost:3003');
const newsServiceProxy = httpProxy('http://localhost:3004');
const orderServiceProxy = httpProxy('http://localhost:3005');
const scriptRunnerServiceProxy = httpProxy('http://localhost:3006');
const scriptBuilderProxy = httpProxy('http://localhost:3007');

const PATH_PUBLIC_PROD = path.join(__dirname, '../../client/dist');
const PATH_PUBLIC_DEV = path.join(__dirname, '../../client/dist');
const PATH_IMAGES_PROD = path.join(__dirname, '../../images');
const PATH_IMAGES_DEV = path.join(__dirname, '../../images');

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

app.get('/social/users', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.post('/social/user/follow/*', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.post('/social/user/un-follow/*', (req, res, next) => {
    socialServiceProxy(req, res, next);
});

app.all('/order', (req, res, next) => {
    orderServiceProxy(req, res, next);
});

app.get('/orders', (req, res, next) => {
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

        const result = await Promise.all([userRequest]);
        returnObj.users = result[0];
        returnObj.channels = result[1];
        returnObj.symbols = result[2];
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