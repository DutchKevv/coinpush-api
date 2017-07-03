import {
	Component, AfterViewInit, Input, OnInit, ElementRef, ViewEncapsulation, NgZone,
	ChangeDetectionStrategy, ViewChild,
} from '@angular/core';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import {InstrumentsService} from '../../services/instruments.service';

declare let $: any;

@Component({
	selector: 'core-list',
	templateUrl: './core-list.component.html',
	styleUrls: ['./core-list.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CoreListComponent implements AfterViewInit, OnInit {

	@Input() public models: Array<InstrumentModel> = [];

	@ViewChild('list') list: ElementRef;

	public activeGroupId = null;
	public searchTerm = '';

	constructor(private _elementRef: ElementRef,
				private _zone: NgZone,
				public instrumentsService: InstrumentsService) {}

	ngOnInit() {

	}

	ngAfterViewInit(): void {
		this._setContextMenu();
	}

	onToggleInputFocus(state) {
		this._elementRef.nativeElement.classList.toggle('focused', !!state);
	}

	public search(text) {
		text = text.toLowerCase();
	}

	private _setContextMenu() {
		this._zone.runOutsideAngular(() => {

			$(this.list.nativeElement)
				.contextMenu({
					items: [
						{
							text: 'Close',
							value: 'close'
						},
						{
							text: 'Close all',
							value: 'closeAll'
						}
					],
					menuSelected: (selectedValue, originalEvent) => {
						let $button = $(originalEvent.target).closest('[data-instrument-id]'),
							id = $button.attr('data-instrument-id');

						switch (selectedValue) {
							case 'close':
								if (id)
									this.instrumentsService.remove(this.instrumentsService.getById(id));

								break;
							case 'closeAll':
								this.instrumentsService.removeAll();
								break;
						}
					}
				});
		});
	}
}