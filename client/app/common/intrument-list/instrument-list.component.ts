import {Component, OnInit, OnDestroy, ElementRef, Pipe, PipeTransform} from '@angular/core';
import {InstrumentsService} from '../../services/instruments.service';

@Pipe({
	name: 'searchFilter'
})
export class SearchFilter implements PipeTransform {
	transform(items: any[], criteria: any): any {
		criteria = criteria.toLowerCase();

		return items.filter(item => {
			for (let key in item ) {
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
	styleUrls: ['./instrument-list.component.scss']
})
export class InstrumentListComponent implements OnDestroy, OnInit {

	constructor(public instrumentService: InstrumentsService,
				private _elementRef: ElementRef) {
	}


	ngOnInit() {
		this._bindContextMenu();
	}

	private _bindContextMenu() {
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
				let instrument = $(originalEvent.target).parents('[data-symbol]').attr('data-symbol');
				this.instrumentService.create({instrument: instrument, live: true});
			}
		});
	}

	ngOnDestroy() {}
}