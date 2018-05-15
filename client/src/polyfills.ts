(window as any).global = window;
import './core/app';
import 'zone.js/dist/zone';
import 'core-js/es7/reflect';

import * as FastClick from './etc/js/fastclick';
FastClick.attach(document.body);