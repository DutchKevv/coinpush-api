import {forEach, random} from 'lodash';
import {
	Component, OnDestroy, ElementRef, Input, ViewChild,
	OnInit, AfterViewInit, ChangeDetectionStrategy, ViewEncapsulation, ContentChild, NgZone
} from '@angular/core';

import {SocketService}      from '../../services/socket.service';
import {DialogComponent} from '../dialog/dialog.component';
import {IndicatorModel} from '../../models/indicator';
import {InstrumentsService} from '../../services/instruments.service';
import {ChartComponent} from '..//chart/chart.component';
import {CookieService} from 'ngx-cookie';
import {ResizableDirective} from '../../directives/resizable.directive';
import {DialogAnchorDirective} from '../../directives/dialoganchor.directive';
import {InstrumentModel} from '../../../../shared/models/InstrumentModel';
import * as interact from 'interactjs';

declare let $: any;

@Component({
	selector: 'chart-box',
	templateUrl: './chart-box.component.html',
	styleUrls: ['./chart-box.component.scss'],
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush,
	entryComponents: [DialogComponent]
})

export class ChartBoxComponent implements OnInit, OnDestroy, AfterViewInit {

	@Input() model: InstrumentModel;
	@Input() focus = true;
	@Input() viewState = 'windowed';
	@Input() minimized = false;

	@ViewChild(ChartComponent) public _chartComponent: ChartComponent;
	@ViewChild(DialogAnchorDirective) private _dialogAnchor: DialogAnchorDirective;
	@ViewChild(ResizableDirective) private _resizableDirective: ResizableDirective;
	@ViewChild('draghandle') private _dragHandle: ElementRef;
	// @ContentChild('draggable') element;

	socket: any;
	$el: any;

	constructor(public _instrumentsService: InstrumentsService,
				private _zone: NgZone,
				private _socketService: SocketService,
				private _cookieService: CookieService,
				private _elementRef: ElementRef) {
	}

	ngOnInit() {
		this.$el = $(this._elementRef.nativeElement);

		if (this.viewState === 'windowed')
			this.restorePosition();

		this.toggleViewState(this.viewState, false);
	}

	ngAfterViewInit() {
		this._bindDrag();
		// console.log(this.element);
		this._resizableDirective.changed.subscribe(() => this.storePosition());
		// this._draggableDirective.changed.subscribe(() => this.storePosition());

		this.putOnTop();

		this.model.changed$.subscribe((changes: any) => {
			if (typeof changes.focus !== 'undefined' && changes.focus === true) {
				this.putOnTop();
			}
		});
	}

	public showIndicatorOptionsMenu(indicatorModel: IndicatorModel): Promise<boolean> {

		return new Promise((resolve) => {

			this._dialogAnchor.createDialog(DialogComponent, {
				title: indicatorModel.name,
				model: indicatorModel,
				buttons: [
					{value: 'add', text: 'Add', type: 'primary'},
					{text: 'Cancel', type: 'default'}
				],
				onClickButton(value) {
					if (value === 'add') {
						resolve(true);
					} else
						resolve(false);
				}
			});
		});
	}

	public setRandomPosition() {
		let pos = this._getRandomPosition();

		this.setPosition(pos[0], pos[1]);
	}

	public putOnTop() {
		let selfIndex = parseInt(this.$el.css('z-index'), 10) || 1,
			highestIndex = selfIndex;

		this.$el.siblings().each((key, el) => {
			let zIndex = parseInt(el.style.zIndex, 10) || 1;

			if (zIndex > highestIndex)
				highestIndex = zIndex;
		});

		this.$el.css('z-index', selfIndex <= highestIndex ? highestIndex + 1 : highestIndex);
	}

	public setSize(width: number | string, height: number | string): void {
		this.$el.width(width).height(height);

		this._chartComponent.reflow();
	}

	public getPosition(): any {
		return {
			x: parseInt(this._elementRef.nativeElement.getAttribute('data-x'), 10),
			y: parseInt(this._elementRef.nativeElement.getAttribute('data-y'), 10),
			w: this._elementRef.nativeElement.clientWidth,
			h: this._elementRef.nativeElement.clientHeight
		};
	}

	public setPosition(y: number | string, x: number | string): void {
		this._elementRef.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
		this._elementRef.nativeElement.setAttribute('data-x', x);
		this._elementRef.nativeElement.setAttribute('data-y', y);
	}

	public storePosition() {
		this._cookieService.putObject(`instrument-${this.model.options.id}-p`, this.getPosition())
	}

	public restorePosition(position?: any): void {
		position = position || <any>this._cookieService.getObject(`instrument-${this.model.options.id}`);

		if (position) {
			this.setPosition(position.y, position.x);
			this.setSize(position.w, position.h);
		}
		else {
			this.setRandomPosition();
			this.storePosition();
		}
	}

	public toggleViewState(viewState: string | boolean, reflow = true) {
		let elClassList = this._elementRef.nativeElement.classList;

		if (typeof viewState === 'string') {

			if (this.viewState !== viewState) {

				elClassList.remove(this.viewState);
				elClassList.add(viewState);

				this.viewState = viewState;

				if (reflow) {
					this._chartComponent.reflow();
				}
			}
		} else {
			elClassList.toggle('minimized', !viewState);
		}
	}

	private _getRandomPosition() {
		let el = this._elementRef.nativeElement,
			containerH = el.parentNode.clientHeight,
			containerW = el.parentNode.clientWidth,
			chartH = el.clientHeight,
			chartW = el.clientWidth;

		return [Math.max(random(0, containerH - chartH), 0), random(0, containerW - chartW)];
	}

	private _bindDrag() {

		this._zone.runOutsideAngular(() => {
			interact(this._elementRef.nativeElement)
				.draggable({
					allowFrom: this._dragHandle.nativeElement,
					// enable inertial throwing
					inertia: true,
					// keep the element within the area of it's parent
					restrict: {
						restriction: 'parent',
						endOnly: true,
						elementRect: {top: 0, left: 0, bottom: 1, right: 1}
					},

					// call this function on every dragmove event
					onmove: (event) => {
						event.preventDefault();

						this._zone.runOutsideAngular(() => {

							let target = this._elementRef.nativeElement;

							let // keep the dragged position in the data-x/data-y attributes
								x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
								y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

							// translate the element
							target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

							// update the posiion attributes
							target.setAttribute('data-x', x);
							target.setAttribute('data-y', y);
						});
					},
					onend: () => this.storePosition(),
				});
		});
	}

	destroy() {
		this._instrumentsService.remove(this.model);
	}

	async ngOnDestroy() {

	}
}