declare let window: any;

import './assets/custom/js/bootstrapper';

if (window.app.platform.isApp) 
    document.body.querySelector('app').classList.add('app')

import 'zone.js/dist/zone';
import 'core-js/es7/reflect';