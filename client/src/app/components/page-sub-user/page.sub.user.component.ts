import {Component, ViewEncapsulation, ChangeDetectionStrategy} from '@angular/core';

@Component({
	selector: 'page-sub-user',
	template: '<router-outlet></router-outlet>',
	styleUrls: ['./page.sub.user.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class PageSubUserComponent {

	constructor() {}
}