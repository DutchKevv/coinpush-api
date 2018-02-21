import { Injectable } from '@angular/core';
import { app } from '../../core/app';

declare const window: any;

@Injectable()
export class BootstrapService {

	public async load() {
		// boot progressbar removal
		if (!app.isReady)
			await new Promise((resolve, reject) => app.once('ready', resolve));

		this._loadFacebookLogin();
	}

	private _loadFacebookLogin() {
		(function (d, s, id) {
			var js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) { return; }
			js = d.createElement(s); js.id = id;
			js.src = "https://connect.facebook.net/en_US/sdk.js";
			fjs.parentNode.insertBefore(js, fjs);
			console.log(js);
		}(document, 'script', 'facebook-jssdk'));

		window.fbAsyncInit = function () {
			window.FB.init({
				appId: '178901869390909',
				cookie: true,
				xfbml: false,
				version: 'v2.12',
				display: 'popup'
			});

			// window.FB.AppEvents.logPageView();
		};
	}
}