import { ChangeDetectionStrategy, Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authenticate.service';
import { AlertService } from '../../services/alert.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE_FIELD, G_ERROR_MISSING_FIELD } from 'coinpush/src/constant';
import { LocationStrategy } from '@angular/common';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {

	@Input() activeFormType = 'login';
	@Input() redirectUrl = '';

	@Output() public loading$: EventEmitter<boolean> = new EventEmitter;

	loginModel = {
		email: '',
		password: ''
	};
	registerModel: any = {
		country: 'US'
	};
	requestPasswordResetModel = {
		email: ''
	};
	passwordResetModel = {
		password: '',
		passwordConf: ''
	};
	addFacebookEmailModel = {
		email: ''
	};

	loading = false;
	returnUrl: string;

	countries = window['countries'];

	constructor(
		public changeDetectorRef: ChangeDetectorRef,
		public authenticationService: AuthenticationService,
		public activeModal: NgbActiveModal,
		private _location: LocationStrategy,
		private route: ActivatedRoute,
		private router: Router,
		private _alertService: AlertService,
		private _userService: UserService
	) { }

	ngOnInit() {
		// get return url from route parameters or default to '/'
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
	}

	/**
	 * 
	 * @param event
	 */
	public async login(event) {
		event.preventDefault();

		this.loading$.emit(true);
		const result = await this.authenticationService.authenticate(this.loginModel.email, this.loginModel.password, null, false, true);

		if (!result)
			this.loading$.emit(false);
	}

	/**
	 * 
	 * @param event 
	 */
	public async fbLogin(event, emailAddress?: string) {
		if (event) {
			event.preventDefault();
			event.stopPropogation();
		}

		this.loading$.emit(true);

		try {
			await this.authenticationService.authenticateFacebook(emailAddress, this.redirectUrl);
		} catch (error) {
			if (error && error.code) {
				switch (error.code) {
					// duplicate field
					case G_ERROR_DUPLICATE_FIELD:
						if (error.field === 'email')
							this._alertService.error(`Email already used`);
						break;
					// missing field
					case G_ERROR_MISSING_FIELD:
						if (error.field === 'email') {
							this.activeFormType = 'addFacebookEmail';
							this.changeDetectorRef.detectChanges();
						}
						break;
					// unknown error
					default:
						console.error(error);
						this._alertService.error(`Facebook login failed...`);
				}
			} else {
				console.error(error);
				this._alertService.error(`Facebook login failed...`);
			}
		} finally {
			this.loading$.emit(false);
		}
	}

	/**
	 * 
	 */
	public async register() {
		this.loading$.emit(true);

		if (this.registerModel.password !== this.registerModel.passwordConf) {
			this.loading$.emit(false);
			this._alertService.error(`Passwords do not match`);
			return;
		}

		try {
			await this._userService.create(this.registerModel);
			this._alertService.success('Registration successful, check your mail', true);

			// pre-set login values
			this.loginModel.email = this.registerModel.email;
			this.loginModel.password = this.registerModel.password;

			// switch to login tab
			this.activeFormType = 'login';
			this.changeDetectorRef.detectChanges();
		} catch (errorObj) {
			this.loading$.emit(false);

			const error = errorObj.error;

			if (error && error.code) {
				switch (error.code) {
					case G_ERROR_DUPLICATE_FIELD:
						if (error.field === 'email')
							this._alertService.error(`Email already used`);
						break;
					default:
						this._alertService.error(`Unknown error occured`);
				}
			} else {
				this._alertService.error(`Unknown error occured`);
			}
		} finally {
			this.loading$.emit(false);
		}
	}

	/**
	 * 
	 */
	public async requestPasswordReset() {
		this.loading$.emit(true);

		// store email to prevent 2 way binding altering with value
		// this ensures same address shows in alert box after async request
		const email = this.requestPasswordResetModel.email;
		const result = await this.authenticationService.requestPasswordReset(email);

		this.loading$.emit(false);

		if (result) {
			this.activeModal.dismiss('Cross click');
		}
	}

	/**
	 * 
	 * @param event 
	 */
	public async resetPassword(event) {
		event.preventDefault();

		if (this.passwordResetModel.password !== this.passwordResetModel.passwordConf) {
			this.loading$.emit(false);
			this._alertService.error(`Passwords do not match`);
			return;
		}

		const token = decodeURIComponent(this.route.snapshot.queryParams['token']);

		this.loading$.emit(true);
		const result = await this.authenticationService.updatePassword(token, this.passwordResetModel.password);
		this.loading$.emit(false);

		if (result) {
			this.activeModal.dismiss('Cross click');

			// make sure token etc is removed from URL and history
			this.router.navigate(['symbols'], { replaceUrl: true });
		}
	}

	ngOnDestroy() {
		this.authenticationService.loginOpen = false;
	}
}