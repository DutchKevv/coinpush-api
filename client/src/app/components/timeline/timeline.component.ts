import { ChangeDetectionStrategy, Component, OnInit, ElementRef, ApplicationRef, ViewChild } from '@angular/core';
import { FilterModel, SocialFeedComponent } from '../social-feed/social.feed.component';

@Component({
	selector: 'app-timeline',
	styleUrls: ['./timeline.component.scss'],
	templateUrl: 'timeline.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class TimelineComponent implements OnInit {

	@ViewChild(SocialFeedComponent) private _socialFeedComponent: SocialFeedComponent;
	@ViewChild('filter') private _filterEl;

	public filterModel = new FilterModel();

	constructor(public elementRef: ElementRef, applicationRef: ApplicationRef) {
		applicationRef.components[0].instance.titleText$.next('News');
		applicationRef.components[0].instance.header.filterClicked$.subscribe((value: boolean) => {
			this._filterEl.nativeElement.classList.toggle('show', value);
		});
	}

	ngOnInit() {
		
	}

	public onFormChange(event) {
		this._socialFeedComponent.reload();
	}
}