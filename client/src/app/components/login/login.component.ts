import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../services/authenticate.service';
import { AlertService } from '../../services/alert.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { G_ERROR_DUPLICATE } from '../../../../../shared/constants/constants';
import countries from '../../../../../shared/data/countries';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {
	
	@Input() formType = 'login';
	@Output() public loading$: EventEmitter<boolean> = new EventEmitter;
	
	loginModel: any = {};
	registerModel: any = {};
	loading = false;
	returnUrl: string;

	countries = countries;

	constructor(
		public authenticationService: AuthenticationService,
		public activeModal: NgbActiveModal,
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

		this.loading = true;
		const result = await this.authenticationService.authenticate(this.loginModel.email, this.loginModel.password, null, false, true);

		if (result)
			return this.router.navigate([this.returnUrl]);

		this._alertService.error('Invalid username / password');
		this.loading = false;
	}

	async register() {
		this.loading$.emit(true);

		this._userService.create(this.registerModel)
			.subscribe(
			data => {
				this._alertService.success('Registration successful', true);
				this.formType = 'login';
			},
			responseError => {
				this.loading$.emit(false);

				try {
					const error = JSON.parse(responseError);
					if (error.code) {
						switch (error.code) {
							case G_ERROR_DUPLICATE:
								if (error.field === 'email')
									this._alertService.error(`Email already used`);
								if (error.field === 'name')
									this._alertService.error(`Username already used`);

								break;
						}
					}
				} catch (error) {
					this._alertService.error('Unknown error occured');
					console.error(error);
				}
			});
	}
}