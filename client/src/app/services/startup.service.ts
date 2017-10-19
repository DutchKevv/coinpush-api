import {Injectable} from '@angular/core';
import {USER_FETCH_TYPE_ACCOUNT_DETAILS} from '../../../../shared/constants/constants';
import {AuthenticationService} from "./authenticate.service";
// import {CacheService} from "./cache.service";
// import {OrderService} from "./order.service";
// import {AuthenticationService} from "./authenticate.service";

@Injectable()
export class StartupService {

	constructor(
				// private _cacheService: CacheService,
				// private _orderService: OrderService
				private _authenticationService: AuthenticationService
	) {
	}

	public async load() {
		this._authenticationService.authenticate();

		await this.loadAppData();
	}

	public async loadStaticData(): Promise<any> {
			return Promise.resolve({});
	}

	public async loadAppData() {
		// await this._cacheService.load();
		// await this._orderService.load();
	}

	public unloadAppData() {

	}
}