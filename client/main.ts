import {AppModule} from './app/app.module';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {environment} from './environments/environment';
import {enableProdMode} from '@angular/core';

if (process.env.ENV === 'production') {
	// Production
	enableProdMode();
} else {
	// Development and test
	Error['stackTraceLimit'] = Infinity;
	require('zone.js/dist/long-stack-trace-zone');
}

platformBrowserDynamic().bootstrapModule(AppModule);

export default {};