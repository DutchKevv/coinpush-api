import {Injectable} from '@angular/core';
import {Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AuthenticationService} from "../services/authenticate.service";
import {BootstrapService} from "../services/bootstrap.service";

@Injectable()
export class AuthGuard implements CanActivate {

	constructor(private _router: Router,
				private _bootstrapService: BootstrapService,
				private _authenticationService: AuthenticationService) {
	}

	async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

		const isValidUser = this._authenticationService.isValidStoredUser();

		if (!isValidUser) {
			this._router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
			return false;
		}

		// if (!this._bootstrapService.isReady)
			// await this._bootstrapService.loadAppData();

		return true;
	}
}