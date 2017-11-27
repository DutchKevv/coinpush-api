import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthenticationService} from '../../services/authenticate.service';
import {AlertService} from '../../services/alert.service';

@Component({
	styleUrls: ['./request-password-reset.component.scss'],
	templateUrl: 'request-password-reset.component.html',
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class RequestPasswordResetComponent {
	email: string;
	loading: boolean = false;

	constructor(private router: Router,
				private authenticationService: AuthenticationService) {}

	async requestPasswordReset(e) {
		e.preventDefault();

		this.loading = true;

		// store email to prevent 2 way binding altering with value
		// this ensures same address shows in alert box after async request
		const email = this.email;
		const result = await this.authenticationService.requestPasswordReset(email);

		this.loading = false;

		if (result) {
			return this.router.navigate(['/login']);
		}
	}
}