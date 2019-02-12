import { Injectable } from '@angular/core';
import { NotificationService } from '../notification.service';
import { UserService } from '../user.service';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../account/account.service';

@Injectable({
    providedIn: 'root'
})
export class DeviceService {

    constructor(
        private _notificationService: NotificationService,
        private _userService: UserService,
        private _accountService: AccountService,
        private _http: HttpClient
    ) {}

    public init() {
        this._notificationService.firebaseToken$.subscribe((token) => {
            if (token)
                this.save();
        })
    }

    public async save() {
		// only continue if user is loggedin
		if (!this._accountService.isLoggedIn)
			return;

		await this._http.post('/device', {
			token: this._notificationService.firebaseToken$.getValue(),
			platformType: 'browser'
			// platformType: app.platform.isApp ? 'app' : 'browser'
		}).toPromise();
    }
    
    public async remove() {
		// only continue if user is loggedin
		if (!this._accountService.isLoggedIn)
			return;

		await this._http.delete('/device/' + this._notificationService.firebaseToken$.getValue()).toPromise();
    }
    
    private _setAppListeners() {
        window.addEventListener('native.keyboardshow', function (e) {
            // setTimeout(function () {
                // document.activeElement.scrollIntoViewIfNeeded();
            // }, 100);
        });
    }
}
