import {CookieService} from 'ngx-cookie';
import {debounce} from 'lodash';
import * as interact from 'interactjs';
import {SocketService} from '../../services/socket.service';
import {
	Component, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, NgZone,
	AfterViewChecked, ViewEncapsulation, ViewChild, ViewContainerRef
} from '@angular/core';
import * as moment from 'moment';
import {InstrumentsService} from '../../services/instruments.service';
import {UserService} from '../../services/user.service';

declare let $: any;

@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class FooterComponent implements OnInit, OnDestroy, AfterViewChecked {

	@ViewChild('resizeHandle') resizeHandle: ElementRef;

	private _maxResizeHeight: number = window.document.body.clientHeight - 100;

	public messages: Array<{
		type: string,
		text: string,
		data?: any
	}> = [];

	constructor(public instrumentsService: InstrumentsService,
				public userService: UserService,
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
		this._setTabs();

		this._socketService.socket.on('debug', messages => {
			messages.forEach(message => {
				message.timePretty = moment(message.time).format('DD MMM YY hh:mm:ss');
			});

			this.messages.push(...messages);
		});
	}

	ngAfterViewChecked() {
		// console.log('FOOTER FOOTER CHECK!!');
	}

	private _setTabs() {
		var self = this;

		$(this._elementRef.nativeElement.shadowRoot.querySelectorAll('.nav-tabs a')).click(function(e) {
			e.preventDefault();

			$(this.parentNode).addClass('active').siblings().removeClass('active');

			$(self._elementRef.nativeElement.shadowRoot)
				.find('.tab-pane')
				.removeClass('active')
				.filter(this.getAttribute('data-target'))
				.addClass('active');
		})
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
				})
				.on('resizeend', () => {
					this._storeHeightInCookie();
				})
		});
	}

	private _bindContextMenu() {
		this._zone.runOutsideAngular(() => {
			(<any>$(this._elementRef.nativeElement.shadowRoot.getElementById('debugger').parentNode)).contextMenu({
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
		});
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