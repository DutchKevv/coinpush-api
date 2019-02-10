process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request');
const companies = require('./news-users.json');
const fs = require('fs');
const path = require('path');

const headers = {
    'cv': '0.0.2'
};

const HOST = (process.env.NODE_ENV || '').startsWith('prod') ? 'https://www.coinpush.app' : 'http://localhost:3100';

companies.forEach(company => {

    company.companyId = company.id;
    delete company.id;

    const img = company.img;
    delete company.img;

    request.post(HOST + '/api/v1/user', { json: company, headers }, (error, response, body) => {
        console.log(response, body);
        
        if (error)
            return console.error(error);

        if (!body.token)
            return console.error('no user token!');
        
        switch (response.statusCode) {
            case 200:
                const authHeader = Object.assign({}, headers, {Authorization: 'Bearer ' + body.token});

                // upload profile img
                request.post(HOST +  '/api/v1/upload/profile', {
                    headers: authHeader,
                    formData: {
                        image: fs.createReadStream(path.join(__dirname, 'images', img))
                    }
                }, (error, respsonse, body) => {
                    if (error)
                        return console.error(error);

                });
                break;
        }
    }
    );
});

process.stdin.resume();