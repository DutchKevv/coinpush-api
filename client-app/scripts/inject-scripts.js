const fs = require('fs');
const path = require('path');

const DIR_INDEX_HTML = path.join(__dirname, '../www/index.html');

fs.readFile(DIR_INDEX_HTML, 'utf8', function (error, data) {
    if (error)
        return console.error(error);

    var result = data.replace('<!-- inject:js:cordova -->', '<script src="cordova.js"></script>');

    fs.writeFile(DIR_INDEX_HTML, result, 'utf8', function (error) {
        if (error) return console.error(error);
    });
});

