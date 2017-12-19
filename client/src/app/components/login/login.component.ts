import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, ElementRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthenticationService} from '../../services/authenticate.service';
import {AlertService} from '../../services/alert.service';

@Component({
	styleUrls: ['./login.component.scss'],
	templateUrl: 'login.component.html',
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginComponent implements OnInit {
	model: any = {};
	loading = false;
	returnUrl: string;

	constructor(public elementRef: ElementRef,
				private route: ActivatedRoute,
				private router: Router,
				private authenticationService: AuthenticationService,
				private alertService: AlertService) {}

	ngOnInit() {
		// get return url from route parameters or default to '/'
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
	}

	async login(e) {
		e.preventDefault();

		this.loading = true;
		const result = await this.authenticationService.authenticate(this.model.email, this.model.password, null, false, true);
	
		if (result)
			return this.router.navigate([this.returnUrl]);
			
		this.alertService.error('Invalid username / password');
		this.loading = false;
	}
}