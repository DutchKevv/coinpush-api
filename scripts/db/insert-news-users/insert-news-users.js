process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const request = require('request');
const companies = require('./news-users.json');
const fs = require('fs');
const path = require('path');

const headers = {
    'cv': '0.0.2'
};

companies.forEach(company => {

    company.companyId = company.id;
    delete company.id;

    const img = company.img;
    delete company.img;

    request.post('https://www.coinpush.app/api/v1/user', { json: company, headers }, (error, response, body) => {
        if (error)
            return console.error(error);
console.log(body);
        if (!body.token)
            return console.error('no user token!');
        
        switch (response.statusCode) {
            case 200:
                const authHeader = Object.assign({}, headers, {Authorization: 'Bearer ' + body.token});

                // upload profile img
                request.post('https://www.coinpush.app/api/v1/upload/profile', {
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