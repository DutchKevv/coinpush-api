import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {AuthenticationService} from "../services/authenticate.service";

@Injectable()
export class AuthGuard implements CanActivate {

	constructor(private _router: Router, private _authenticationService: AuthenticationService) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		if (this._authenticationService.isValidStoredUser())
			return true;

		// not logged in so redirect to login page with the return url
		this._router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
	}
}