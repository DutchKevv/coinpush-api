import {
	Component, OnInit, ElementRef, QueryList, ViewChildren, ChangeDetectionStrategy, ViewEncapsulation, NgZone,
	ViewChild
}  from '@angular/core';

import {InstrumentsService} from '../../services/instruments.service';
import {ChartBoxComponent} from '../chart-box/chart-box.component';

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

	constructor(public instrumentsService: InstrumentsService,
				private _zone: NgZone,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		this.instrumentsService.instruments$.subscribe(() => this.setFocusToHighestIndex());
	}

	tileWindows() {
		this._zone.runOutsideAngular(() => {
			let containerW = this._elementRef.nativeElement.clientWidth,
				containerH = this._elementRef.nativeElement.clientHeight,
				size = Math.floor(this._getTileSize(containerW, containerH, this.charts.length)),
				columnCounter = 0,
				rowCount = 0;

			// First set the size of the box, but wait with rendering,
			// This is to give a 'snappy' feeling (re-rendering the charts is pretty slow)
			this.charts.forEach((chart) => {
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
	}

	setFocusToHighestIndex(): void {
		if (!this.charts)
			return;

		let highest = 1,
			ref = this.charts.first;

		this.charts.forEach(chart => {
			if (chart.$el[0].style.zIndex > highest)
				ref = chart;
		});

		// this.toggleFocused(ref);
	}

	private _getTileSize(width, height, number) {
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
	}
}