import { ChangeDetectionStrategy, Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { AlertService } from '../../services/alert.service';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE_FIELD, G_ERROR_MISSING_FIELD } from 'coinpush/src/constant';
import { LocationStrategy } from '@angular/common';
import { IModalComponent } from '../modal/modal.component';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit, IModalComponent {

	public activeForm = 'login';
	public activeForm$ = new BehaviorSubject('login');

	@Input() redirectUrl = '';
	@Output() public busy$: EventEmitter<boolean> = new EventEmitter;

	@ViewChild('modalFooter') public modalFooterRef: ElementRef;

	public modalOptions = {
		width: '400px',
		title: 'Login'
	};

	public loginForm: FormGroup;
	public registerForm: FormGroup;
	public addFacebookEmailForm: FormGroup;

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
		public authenticationService: AuthService,
		private _location: LocationStrategy,
		private route: ActivatedRoute,
		private router: Router,
		private _alertService: AlertService,
		private _userService: UserService,
		private _formBuilder: FormBuilder
	) { }

	ngOnInit() {
		// get return url from route parameters or default to '/'
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

		this.loginForm = this._formBuilder.group({
			email: ['', [Validators.required]],
			password: ['', [Validators.required]]
		});

		this.registerForm = this._formBuilder.group({
			email: ['', [Validators.required]],
			name: ['', [Validators.required]],
			password: ['', [Validators.required]],
			passwordConfirm: ['', [Validators.required]],
		});

		this.addFacebookEmailForm = this._formBuilder.group({
			email: ['', [Validators.required]]
		});
	}

	public toggleActiveForm() {
		alert(2)
	}
	/**
	 * 
	 * @param event
	 */
	public async login() {
		this.busy$.emit(true);
		const result = await this.authenticationService.authenticate(this.loginForm.value.email, this.loginForm.value.password, null, false, true);

		if (!result)
			this.busy$.emit(false);
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

		this.busy$.emit(true);

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
							this.activeForm$.next('addFacebookEmail');
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
			this.busy$.emit(false);
		}
	}

	/**
	 * 
	 */
	public async register() {
		this.busy$.emit(true);

		const values = this.registerForm.value;

		if (values.password !== values.passwordConfirm) {
			this.busy$.emit(false);
			this._alertService.error(`Passwords do not match`);
			return;
		}

		try {
			await this._userService.create(values);
			this._alertService.success('Registration successful, check your mail', true);

			// pre-set login values
			this.loginForm.controls.email.setValue(values.email);
			this.loginForm.controls.password.setValue(values.password);

			// switch to login tab
			this.activeForm$.next('login');
		} catch (error) {
			this.busy$.emit(false);

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
			this.busy$.emit(false);
		}
	}

	/**
	 * 
	 */
	public async requestPasswordReset() {
		this.busy$.emit(true);

		// store email to prevent 2 way binding altering with value
		// this ensures same address shows in alert box after async request
		const email = this.requestPasswordResetModel.email;
		const result = await this.authenticationService.requestPasswordReset(email);

		this.busy$.emit(false);

		if (result) {
			// this.activeModal.dismiss('Cross click');
		}
	}

	/**
	 * 
	 * @param event 
	 */
	public async resetPassword(event) {
		event.preventDefault();

		if (this.passwordResetModel.password !== this.passwordResetModel.passwordConf) {
			this.busy$.emit(false);
			this._alertService.error(`Passwords do not match`);
			return;
		}

		const token = decodeURIComponent(this.route.snapshot.queryParams['token']);

		this.busy$.emit(true);
		const result = await this.authenticationService.updatePassword(token, this.passwordResetModel.password);
		this.busy$.emit(false);

		if (result) {
			// this.activeModal.dismiss('Cross click');

			// make sure token etc is removed from URL and history
			this.router.navigate(['symbols'], { replaceUrl: true });
		}
	}

	ngOnDestroy() {
		this.authenticationService.loginOpen = false;
	}
}