import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth/auth.service';
import { AccountService } from '../services/account/account.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate {

	constructor(
		private _accountService: AccountService,
		private _authenticationService: AuthService
	) {

	}

	async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		switch (state.url) {
			case '/settings':
			case '/user/undefined/feed':
				if (!this._accountService.isLoggedIn) {
					this._authenticationService.showLoginRegisterPopup(undefined, state.url);
					return false;
				}
			default:
				return true;
		}

	}
}