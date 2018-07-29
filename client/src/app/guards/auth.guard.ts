import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthenticationService } from '../services/authenticate.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate {

	constructor(
		private _userService: UserService,
		private _authenticationService: AuthenticationService
	) {

	}

	async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		switch (state.url) {
			case '/settings':
			case '/user/undefined/feed':
				if (!this._userService.model.options._id) {
					this._authenticationService.showLoginRegisterPopup(undefined, state.url);
					return false;
				}
			default:
				return true;
		}

	}

	// async canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
	// 	console.log(state);//'candidates'
	// 	switch (state.url) {
	// 		case '/settings':
	// 			if (!this._userService.model.options._id) {
	// 				this._authenticationService.showLoginRegisterPopup();
	// 				return false;
	// 			}
	// 	}
	// 	console.log(state);//'candidates'
	// 	return true;
	// }
}