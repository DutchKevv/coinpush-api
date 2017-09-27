import {
	Component, OnInit, OnDestroy, ElementRef, Pipe, PipeTransform, ChangeDetectionStrategy, NgZone, ViewEncapsulation, ViewChild
} from '@angular/core';

import {InstrumentsService} from '../../services/instruments.service';
import {CacheService, CacheSymbol} from '../../services/cache.service';

@Pipe({
	name: 'searchFilter'
})
export class SearchFilter implements PipeTransform {
	transform(items: any[], criteria: any): any {
		criteria = criteria.toLowerCase();
		console.log('criteria criteria criteria', criteria);

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
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentListComponent implements OnDestroy, OnInit {

	@ViewChild('elementsContainer') elementsContainer: ElementRef;
	@ViewChild('resizeHandle') splitter: ElementRef;

	private _elements: any = {};

	constructor(public cacheService: CacheService,
				public instrumentService: InstrumentsService,
				private _elementRef: ElementRef,
				private _zone: NgZone) {
	}

	ngOnInit() {
		this._bindContextMenu();

		this.cacheService.symbolList$.subscribe(() => this._createRows());
		this.cacheService.changed$.subscribe(symbols => this._updateRows(symbols));
	}

	public search(text) {
		text = text.toLowerCase();

		let list = this.cacheService.symbolList$.getValue()
				.filter(symbol => symbol.options.name.toLowerCase().includes(text))
				.map(symbol => symbol.options.name),
			key;

		for (key in this._elements) {
			if (this._elements.hasOwnProperty(key)) {
				this._elements[key].style.display = list.includes(key) ? 'block' : 'none';
			}
		}
	}

	private _updateRows(symbols) {
		this.cacheService.symbolList$.getValue().forEach(symbol => {
			if (symbols.indexOf(symbol.options.name) === - 1)
				return;

			let row = this._elements[symbol.options.name];

			row.children[1].innerText = symbol.options.bid;
			row.children[1].className = symbol.options.bidDirection;
			row.children[2].innerText = symbol.options.ask;
			row.children[2].className = symbol.options.askDirection;
		});
	}

	private _createRows() {
		let body = '';

		this.cacheService.symbolList$.subscribe((symbolList: CacheSymbol[]) => {
			symbolList.forEach(symbol => {

				body += `
<tr data-symbol="${symbol.options.name}">
	<td>${symbol.options.name.replace('_', ' / ')}</td>
	<td>${symbol.options.bid}</td>
	<td>${symbol.options.bid}</td>
</tr>`;
			});
		});

		this.elementsContainer.nativeElement.innerHTML = body;

		Array.prototype.forEach.call(this.elementsContainer.nativeElement.children, (child) => {
			child.onclick = e => this.instrumentService.create([{symbol: e.currentTarget.getAttribute('data-symbol')}]);
			this._elements[child.getAttribute('data-symbol')] = child;
		});
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
					this.instrumentService.create([{symbol: symbol}]);
				}
			});
		});
	}

	ngOnDestroy() {
	}
}