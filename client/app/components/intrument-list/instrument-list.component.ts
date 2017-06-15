import {
	Component, OnInit, OnDestroy, ElementRef, Pipe, PipeTransform, ChangeDetectionStrategy,
	ChangeDetectorRef, NgZone
} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';
import {CacheService} from '../../services/cache.service';

@Pipe({
	name: 'searchFilter'
})
export class SearchFilter implements PipeTransform {
	transform(items: any[], criteria: any): any {
		criteria = criteria.toLowerCase();

		return items.filter(item => {
			for (let key in item) {
				if (('' + item[key]).toLowerCase().includes(criteria)) {
					return true;
				}
			}
			return false;
		});
	}
}


@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnDestroy, OnInit {

	constructor(public cacheService: CacheService,
				public instrumentService: InstrumentsService,
				private _elementRef: ElementRef,
				private _zone: NgZone) {
	}

	ngOnInit() {
		this._bindContextMenu();
	}

	private _bindContextMenu() {
		this._zone.runOutsideAngular(() => {
			(<any>$(this._elementRef.nativeElement)).contextMenu({
				items: [
					{
						text: 'Create Chart',
						value: 'createChart'
					},
					{
						text: 'Favorite'
					}
				],
				menuSelected: (selectedValue, originalEvent) => {
					let symbol = $(originalEvent.target).parents('[data-symbol]').attr('data-symbol');
					this.instrumentService.create([{symbol: symbol, live: true}]);
				}
			});
		});
	}


	ngOnDestroy() {
	}
}