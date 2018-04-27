import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authenticate.service';
import { AlertService } from '../../services/alert.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE } from 'coinpush/constant';
import { LocationStrategy } from '@angular/common';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {

	@Input() formType = 'login';
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

	async login(e) {
		e.preventDefault();

		this.loading$.emit(true);
		const result = await this.authenticationService.authenticate(this.loginModel.email, this.loginModel.password, null, false, true);

		if (!result)
			this.loading$.emit(false);
	}

	async fbLogin() {
		this.loading$.emit(true);

		try {
			await this.authenticationService.authenticateFacebook();
		} catch (errorObj) {
			const error = errorObj.error;

			if (error && error.code) {
				switch (error.code) {
					case G_ERROR_DUPLICATE:
						if (error.field === 'email')
							this._alertService.error(`Email already used`);
						break;
					default:
						this._alertService.error(`Facebook login failed...`);
				}
			} else {
				this._alertService.error(`Facebook login failed...`);
			}
		} finally {
			this.loading$.emit(false);
		}
	}

	async register() {
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
			this.formType = 'login';
			this.changeDetectorRef.detectChanges();
		} catch (errorObj) {
			this.loading$.emit(false);

			const error = errorObj.error;

			if (error && error.code) {
				switch (error.code) {
					case G_ERROR_DUPLICATE:
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

	async requestPasswordReset() {
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

	async resetPassword(e) {
		e.preventDefault();
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