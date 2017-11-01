import { ChangeDetectionStrategy, Component, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../services/alert.service';
import { G_ERROR_DUPLICATE } from '../../../../../shared/constants/constants';

@Component({
	styleUrls: ['./register.component.scss'],
	templateUrl: 'register.component.html',
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegisterComponent {

	@Output() public loading$: EventEmitter<boolean> = new EventEmitter;

	model: any = {};

	constructor(
		private router: Router,
		private userService: UserService,
		private alertService: AlertService) { }

	register() {
		this.loading$.emit(true);

		this.userService.create(this.model)
			.subscribe(
			data => {
				this.alertService.success('Registration successful', true);
				this.router.navigate(['/login']);
			},
			responseError => {
				this.loading$.emit(false);

				try {
					const error = JSON.parse(responseError);
					if (error.code) {
						switch (error.code) {
							case G_ERROR_DUPLICATE:
								if (error.field === 'email')
									this.alertService.error(`Email already used`);
								if (error.field === 'name')
									this.alertService.error(`Username already used`);

								break;
						}
					}
				} catch (error) {
					this.alertService.error('Unknown error occured');
					console.error(error);
				}
			});
	}
}