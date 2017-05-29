import {CookieService} from 'ngx-cookie';
declare var $: any;

import * as _ from 'lodash';
import {SocketService} from '../../services/socket.service';
import {Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import * as moment from 'moment';
import 'jquery-resizable-dom';

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})

export class FooterComponent implements OnInit, OnDestroy {

	private _maxResizeHeight: number = window.document.body.clientHeight - 100;

	public messages: Array<{
		type: string,
		text: string,
		data?: any
	}> = [];

	constructor(private socketService: SocketService,
				private _cookieService: CookieService,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		// Set window.resize handle
		this._restoreHeightFromCookie();
		this._setWindowResizeHandle();
		this._setDragger();
		this._bindContextMenu();

		this.socketService.socket.on('debug', messages => {
			messages.forEach(message => {
				message.timePretty = moment(message.time).format('DD MMM YY hh:mm:ss');
			});

			this.messages.push(...messages);
		});
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
		$(window).on('resize.debugger', _.debounce(this._onResizeEvent.bind(this), 250));
	}

	private _onResizeEvent() {
		this._maxResizeHeight = window.document.body.clientHeight - 100;

		if (this._elementRef.nativeElement.clientHeight > this._maxResizeHeight)
			this._elementRef.nativeElement.style.height = this._maxResizeHeight + 'px';
	}

	private _setDragger() {
		$(this._elementRef.nativeElement).resizable({
			handleSelector: '.splitter',
			resizeWidth: false,
			resizeHeightFrom: 'top',
			onDrag: (e, $el, newWidth, newHeight) => {
				e.preventDefault();

				let maxHeight = this._maxResizeHeight,
					minHeight = 21;

				if (newHeight > maxHeight)
					newHeight = maxHeight;
				else if (newHeight < minHeight)
					newHeight = minHeight;

				$el[0].style.height = newHeight + 'px';

				return false;
			},
			onDragEnd: () => this._storeHeightInCookie()
		});
	}

	private _bindContextMenu() {
		(<any>$(this._elementRef.nativeElement.querySelector('#backtest').parentNode)).contextMenu({
			items: [
				{
					text: 'Clear',
					value: 'clear'
				}
			],
			menuSelected: (selectedValue, originalEvent) => {
				if (selectedValue === 'clear') {
					this.messages = [];
				}
			}
		});
	}

	clearCache() {
		this.socketService.socket.emit('system:clear-cache', {}, (err: any) => {
			if (err)
				alert(err);

			alert('Cleaned cache');
		});
	}

	ngOnDestroy() {
		$(window).off('resize.debugger');
	}
}