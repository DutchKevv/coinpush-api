import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authenticate.service';
import { AlertService } from '../../services/alert.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE } from 'coinpush/constant';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {

	@Input() formType = 'login';
	@Output() public loading$: EventEmitter<boolean> = new EventEmitter;

	loginModel: any = {};
	registerModel: any = {
		country: 'US'
	};
	loading = false;
	returnUrl: string;

	countries = window['countries'];

	constructor(
		public authenticationService: AuthenticationService,
		public activeModal: NgbActiveModal,
		private route: ActivatedRoute,
		private router: Router,
		private _alertService: AlertService,
		private _changeDetectorRef: ChangeDetectorRef,
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
		} catch (error) {
			this._alertService.error('Facebook login failed...');
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
			this._changeDetectorRef.detectChanges();
		} catch (error) {
			this.loading$.emit(false);
			console.error(error);
			if (error.code) {
				switch (error.code) {
					case G_ERROR_DUPLICATE:
						if (error.field === 'email')
							this._alertService.error(`Email already used`);
						if (error.field === 'name')
							this._alertService.error(`Username already used`);
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

	ngOnDestroy() {
		this.authenticationService.loginOpen = false;
	}
}