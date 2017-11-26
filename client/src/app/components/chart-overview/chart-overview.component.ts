import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild
} from '@angular/core';

import { InstrumentsService } from '../../services/instruments.service';
import { ChartBoxComponent } from '../chart-box/chart-box.component';
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { SymbolModel } from "../../models/symbol.model";
import { InstrumentModel } from "../../models/instrument.model";
import { Subject } from 'rxjs';

declare let $: any;

@Component({
	selector: 'chart-overview',
	templateUrl: './chart-overview.component.html',
	styleUrls: ['./chart-overview.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChartOverviewComponent implements OnInit {

	@ViewChildren(ChartBoxComponent) charts: QueryList<ChartBoxComponent>;
	@ViewChild('container') container;

	public activeSymbol$: Subject<SymbolModel> = new Subject();
	public activeSymbol: SymbolModel;

	constructor(public instrumentsService: InstrumentsService) {
	}

	ngOnInit(): void {
		// this.instrumentsService.instruments$.subscribe(() => this.setFocusToHighestIndex());
	}

	onSymbolChange(symbolModel: SymbolModel): void {
	
		// this.activeSymbol$.next(null);
		// if (symbolModel === null) {
		//
		// 	return;
		// }
		// setTimeout(() => {
			this.activeSymbol = symbolModel;
		// }, 0);

	}

	addIndicator(name: string) {

	}

	/*tileWindows() {
		this._zone.runOutsideAngular(() => {

			let containerW = this.container.nativeElement.clientWidth,
				containerH = this.container.nativeElement.clientHeight,
				size = Math.floor(this._getTileSize(containerW, containerH, this.charts.length)),
				columnCounter = 0,
				rowCount = 0;

			// First set the size of the box, but wait with rendering,
			// This is to give a 'snappy' feeling (re-rendering the charts is pretty slow)
			this.charts.forEach((chart) => {
				if (chart.viewState === 'minimized')
					return;

				chart.setStyles({
					x: columnCounter * size,
					y: rowCount * size,
					w: size,
					h: size
				}, true);

				if ((++columnCounter + 1) * size > containerW) {
					columnCounter = 0;
					rowCount++;
				}
			});
		});
	}*/

	/*setFocusToHighestIndex(): void {
		if (!this.charts)
			return;

		let highest = 1,
			ref = this.charts.first;

		this.charts.forEach(chart => {
			if (chart.$el[0].style.zIndex > highest)
				ref = chart;
		});

		// this.toggleFocused(ref);
	}*/

	/*private _getTileSize(width, height, number) {
		let area = height * width,
			elementArea = Math.round(area / number);

		// Calculate side length if there is no "spill":
		let sideLength = Math.round(Math.sqrt(elementArea));

		// We now need to fit the squares. Let's reduce the square size
		// so an integer number fits the width.
		let numX = Math.ceil(width / sideLength);
		sideLength = width / numX;
		while (numX <= number) {
			// With a bit of luck, we are done.
			if (Math.floor(height / sideLength) * numX >= number) {
				// They all fit! We are done!
				return sideLength;
			}
			// They don't fit. Make room for one more square i each row.
			numX++;
			sideLength = width / numX;
		}
		// Still doesn't fit? The window must be very wide
		// and low.
		sideLength = height;
		return sideLength;
	}*/
}