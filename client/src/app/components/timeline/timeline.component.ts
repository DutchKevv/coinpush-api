import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef, HostListener } from '@angular/core';

@Component({
	selector: 'app-timeline',
	styleUrls: ['./timeline.component.scss'],
	templateUrl: 'timeline.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class TimelineComponent implements OnInit {

	@Output() public loading$: EventEmitter<boolean> = new EventEmitter;

	public socialFeedType = 'timeline';

	/**
	 * mobile nav menu back press close
	 * @param event 
	 */
	@HostListener('scroll', ['$event'])
	onPopState(event) {
		// console.log(event);
		return false;
	}
	
	constructor(
		
	) { }

	ngOnInit() {
		// get return url from route parameters or default to '/
	}

	ngOnDestroy() {
		
	}
}