import { ChangeDetectionStrategy, Component, OnInit, ElementRef, ApplicationRef } from '@angular/core';

@Component({
	selector: 'app-timeline',
	styleUrls: ['./timeline.component.scss'],
	templateUrl: 'timeline.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class TimelineComponent implements OnInit {

	public filterList = {
		sources: [
			{
				name: 'Crypto Coins News',
				value: 'ccn'
			},
			{
				name: 'CoinDesk',
				value: 'coindesk'
			},
			{
				name: 'IG',
				value: 'ig'
			}
		]
	}

	constructor(public elementRef: ElementRef, applicationRef: ApplicationRef) {
		applicationRef.components[0].instance.titleText$.next('News');
	}

	ngOnInit() {}
}