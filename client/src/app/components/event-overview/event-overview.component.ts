import {
	ChangeDetectionStrategy, Component, ElementRef, Host, Input, NgZone, OnInit, Output, Pipe, PipeTransform,
	ViewEncapsulation
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { NewsService } from '../../services/news.service';

@Component({
	selector: 'app-event-overview',
	styleUrls: ['./event-overview.component.scss'],
	templateUrl: 'event-overview.component.html',
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventOverviewComponent implements OnInit {

	@Output() crypto$: BehaviorSubject<any> = new BehaviorSubject([]);
	@Output() top$: Subject<any> = new Subject();

	constructor(
		private _newsService: NewsService) {
	}

	async ngOnInit() {
		const news = await this._newsService.find();
		console.log(news);

		this.top$.next(news.top);
		this.crypto$.next(news.crypto);
	}

	onClickItem(event, url: string) {
		event.preventDefault();
		event.stopPropagation();

		window.open(url)
	}
}