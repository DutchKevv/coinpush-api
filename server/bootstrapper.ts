import App from './app';

const argv = require('minimist')(process.argv.slice(2));

console.log(argv);

const app = new App(argv.config ? JSON.parse(argv.config) : {});

app.init();

export default app;