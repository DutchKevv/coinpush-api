import {CookieService} from 'ngx-cookie';
import {debounce} from 'lodash';
import * as interact from 'interactjs';
import {SocketService} from '../../services/socket.service';
import {
	Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, NgZone,
	AfterViewChecked, ViewEncapsulation, ViewChild, AfterViewInit, ViewContainerRef, Input
} from '@angular/core';
import * as moment from 'moment';
import {InstrumentsService} from '../../services/instruments.service';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class FooterComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

	@ViewChild('resizeHandle') resizeHandle: ElementRef;

	private _maxResizeHeight: number = window.document.body.clientHeight - 100;

	public messages: Array<{
		type: string,
		text: string,
		data?: any
	}> = [];

	constructor(public instrumentsService: InstrumentsService,
				private vcRef: ViewContainerRef,
				private _zone: NgZone,
				private _socketService: SocketService,
				private _cookieService: CookieService,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		// Set window.resize handle
		this._restoreHeightFromCookie();
		this._setWindowResizeHandle();
		this._bindContextMenu();
		this._setDraggable();

		this._socketService.socket.on('debug', messages => {
			messages.forEach(message => {
				message.timePretty = moment(message.time).format('DD MMM YY hh:mm:ss');
			});

			this.messages.push(...messages);
		});
	}

	ngAfterViewInit() {
		// var parentComponent1 =
		// console.log('blablabla', this._elementRef.nativeElement.getRootNode().host);
		//
		//
		// let current = this.parent.elementRef.nativeElement.style.gridTemplateRows;
		// window['test'] = this.parent.elementRef.nativeElement;
		// console.log(current);
		// console.log(this._elementRef.nativeElement.parentNode)
	}

	ngAfterViewChecked() {
		// console.log('CHECK!!');
	}

	private _restoreHeightFromCookie() {
		let storedHeight = this._cookieService.get('footer-resize-height');

		if (storedHeight) {
			this._elementRef.nativeElement.style.height = storedHeight;
		}
	}

	private _storeHeightInCookie() {
		this._cookieService.put('footer-resize-height', this._elementRef.nativeElement.style.height);
	}

	private _setWindowResizeHandle() {
		$(window).on('resize.debugger', debounce(this._onResizeEvent.bind(this), 250));
	}

	private _onResizeEvent() {
		this._maxResizeHeight = window.document.body.clientHeight - 100;

		if (this._elementRef.nativeElement.clientHeight > this._maxResizeHeight)
			this._elementRef.nativeElement.style.height = this._maxResizeHeight + 'px';
	}

	private _setDraggable() {
		this._zone.runOutsideAngular(() => {
			interact(this._elementRef.nativeElement)
				.resizable({
					preserveAspectRatio: true,
					edges: { left: false, right: false, bottom: false, top: true }
				})
				.on('resizemove', function (event) {
					let target = event.target,
						y = (parseFloat(target.getAttribute('data-y')) || 0);

					target.style.height = event.rect.height + 'px';
					target.setAttribute('data-y', y);
				});
		});

	}

	private _bindContextMenu() {
		// (<any>$(this._elementRef.nativeElement.querySelector('#backtest').parentNode)).contextMenu({
		// 	items: [
		// 		{
		// 			text: 'Clear',
		// 			value: 'clear'
		// 		}
		// 	],
		// 	menuSelected: (selectedValue, originalEvent) => {
		// 		if (selectedValue === 'clear') {
		// 			this.messages = [];
		// 		}
		// 	}
		// });
	}

	clearCache() {
		this._socketService.send('system:clear-cache', {}, (err: any) => {
			if (err)
				alert(err);

			alert('Cleaned cache');
		});
	}

	ngOnDestroy() {
		$(window).off('resize.debugger');
	}
}