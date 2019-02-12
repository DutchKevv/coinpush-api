import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '../../../node_modules/@angular/common/http';
import { ConfigService } from './config/config.service';
import { StorageService } from './storage.service';
import { AccountService } from './account/account.service';
import { AuthService } from './auth/auth.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

@Injectable({
	providedIn: 'root',
})
export class BootstrapService {

	constructor(
		private _http: HttpClient,
		private _configService: ConfigService,
		private _storageService: StorageService,
		private _accountService: AccountService,
		private _cacheService: CacheService,
		private _notificationService: NotificationService
	) { }

	public async load(): Promise<void> {
		await this._storageService.init();
		const account = await this._storageService.getAccountData();

		if (account && account._id) {
			this._accountService.account$.next(account);
		}

		try {
			const appData = <any>await this._http.get('authenticate?profile=true').toPromise();

			if (appData.user) {
				await this._accountService.update(appData.user);
				this._accountService.isLoggedIn = true;
			}

			this._cacheService.setSymbols(appData.symbols);
			this._notificationService.unreadCount$.next(parseInt(appData.notifications.unreadCount, 10));

			if (this._configService.platform.isApp) {
				this._prepareApp();
			}
		} catch (error) {
			console.error(error);
		}
	}

	private async _loadAccount(data) {
		await this._http.get('authenticate?profile=true', { headers: { 'authorization': 'Bearer ' + data.token } }).toPromise();
		// await this._authService.authenticate()
	}

	private async _prepareApp(): Promise<void> {
		// special root class
		document.body.classList.add('app');

		if (this._configService.platform.isIOS) {
			document.body.classList.add('ios');
		}

		if (this._configService.platform.isAndroid) {
			document.body.classList.add('android');
		}

		await this._waitOnCordovaReady();
	}

	private _waitOnCordovaReady(): Promise<void> {
		return new Promise((resolve, reject) => {
			document.addEventListener("deviceready", () => resolve(), { once: true, passive: true });
		});
	}
}