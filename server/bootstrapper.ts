import App from './app';

const argv = require('minimist')(process.argv.slice(2));

const app = new App(argv.config ? JSON.parse(argv.config) : {});

app.init();

export default app;