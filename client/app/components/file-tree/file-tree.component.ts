import {DialogAnchorDirective} from '../../directives/dialoganchor.directive';
declare let socket: any;
declare let $: any;

import {
	Component, AfterViewInit, OnDestroy, ElementRef, ViewEncapsulation, ViewChild, Output, EventEmitter,
	NgZone
} from '@angular/core';
import {SocketService}  from '../../services/socket.service';
import {ModalService} from '../../services/modal.service';
import {DialogComponent} from '../dialog/dialog.component';

let NAV_WITH = 300;
let speed = 200;


@Component({
	selector: 'file-tree',
	templateUrl: './file-tree.component.html',
	styleUrls: [
		'../../../node_modules/jstree/dist/themes/default/style.css',
		'../../../node_modules/jstree/dist/themes/default-dark/style.css',
		'./file-tree.component.scss'
	],
	encapsulation: ViewEncapsulation.Native,
	entryComponents: [DialogComponent]
})

export class FileTreeComponent implements AfterViewInit, OnDestroy {

	@ViewChild(DialogAnchorDirective) private _dialogAnchor: DialogAnchorDirective;
	@Output() updateEvent = new EventEmitter<any>();

	socket: any;
	$el: any;
	jstree: any;
	open = false;

	private _data = [];

	constructor(
		private _zone: NgZone,
		private _socketService: SocketService,
		private _modalService: ModalService,
		private _elementRef: ElementRef) {

		this.jstree = null;
	}

	ngAfterViewInit(): void {
		this.load();

		this.$el = $(this._elementRef.nativeElement.shadowRoot.getElementById('fileListContainer'));

		let swipeOptions = {
			triggerOnTouchEnd: true,
			swipeStatus: this.onSwipe.bind(this),
			allowPageScroll: 'vertical',
			threshold: 100
		};

		$('body').swipe(swipeOptions);

		this._bindContextMenu();

		this._socketService.socket.on('editor:directory-list', (err: any, result: any) => {

			this._toggleBusyIcon(false);

			if (err)
				return this._showError(err);

			if (!result)
				return;

			this._data = this._convertData(result);

			if (this.jstree)
				return this.update(this._data);

			this._zone.runOutsideAngular(() => {
				this.$el.jstree({
					plugins: [
						'state',
						'ui',
						'html_data'
					],
					core: {
						check_callback: true,
						get_selected: true,
						multiple: false,
						data: this._data,
						themes: {
							name: 'default-dark',
							dots: true,
							icons: true
						}
					}
				});

				this.$el.on('select_node.jstree', (e: any, data: any) => {
					this.updateEvent.emit({
						type: 'select',
						value: data.node.id
					});
				});

				this.jstree = this.$el.jstree(true);
			});
		});
	}

	public load() {
		this._toggleBusyIcon(true);
		this._socketService.send('editor:directory-list');
	}

	update(data = this._data) {
		let state = this.jstree.get_state();
		this.jstree.settings.core.data = data;
		this.jstree.set_state(state);
		this.jstree.refresh();
	}

	private _convertData(arr: any): Array<any> {
		for (let i = 0, len = arr.length, node; i < len; i++) {
			node = arr[i];
			node.text = node.name;

			// Directory
			if (!node.isFile) {
				this._convertData.call(this, node.children);
			// File
			// TODO: Set icon for each file type (.js, .ts, .json etc)
			} else {
				node.icon = 'glyphicon glyphicon-file';
			}
		}

		return arr;
	}

	private _bindContextMenu() {
		let selected = null;

		this.$el.contextMenu({
			menuSelected: (selectedValue, originalEvent) => {
				let filePath = originalEvent.target.id.split('_anchor')[0];

				switch (selectedValue) {
					case 'open':
						this._open(filePath);
						break;
					case 'rename':
						this._rename(filePath);
						break;
					case 'delete':
						this._delete(filePath);
						break;
					case 'createFile':
						this._createFile(filePath);
						break;
					case 'createDirectory':
						this._createDirectory(filePath);
						break;

				}
			},
			beforeCreate: (settings, originalEvent) => {
				if (!originalEvent.target.classList.contains('jstree-anchor'))
					return false;

				if (selected) {
					selected.classList.remove('contextFocus');
				}

				selected = originalEvent.target;
				selected.classList.add('contextFocus');

				let isFile = selected.getElementsByClassName('glyphicon-file').length > 0;

				settings.items = [
					{
						text: 'Open',
						value: 'open'
					},
					{
						text: 'Rename',
						value: 'rename'
					}
				];

				// Directory
				if (!isFile) {
					settings.items.push(...[
						{
							text: 'Create file',
							value: 'createFile'
						},
						{
							text: 'Create directory',
							value: 'createDirectory'
						}
					]);
				}

				settings.items.push({
					text: 'Delete',
					value: 'delete'
				});
			},
			afterDestroy: () => {
				if (selected) {
					selected.classList.remove('contextFocus');
					selected = null;
				}
			}
		});
	}

	private _open(id) {
		this.jstree.deselect_all(true);
		this.jstree.open_node(id);
		this.jstree.select_node(id);
	}

	private _rename(filePath) {
		let oName = this.jstree.get_node(filePath).text,
			model =  {
			inputs: [
				{
					value: oName,
					type: 'text'
				}
			]
		};

		return new Promise((resolve) => {

			let self = this;

			let dialogComponentRef = this._modalService.create(DialogComponent, {
				type: 'dialog',
				title: 'Rename',
				showBackdrop: false,
				showCloseButton: false,
				model: model,
				buttons: [
					{value: 'add', text: 'add', type: 'primary'},
					{text: 'cancel', type: 'candel'}
				],
				onClickButton: (value) => {
					if (value === 'add') {
						this._toggleBusyIcon(true);

						let newName = model.inputs[0].value;

						// Same as old name
						if (oName === newName)
							return;

						this._socketService.send('editor:rename', {id: filePath, name: newName}, (err, result) => {
							this._toggleBusyIcon(false);

							if (err)
								return alert(err);

							this.jstree.rename_node(filePath, newName);

							this.updateEvent.emit({
								type: 'rename',
								value: newName
							});
						});
					}
				}
			});
		});
	}

	private _delete(filePath) {
		this.jstree.delete_node(filePath);

		// TODO: Show confirmation popup
		this._toggleBusyIcon(true);

		this._socketService.send('editor:file:delete', {filePath: filePath}, (err) => {
			this._toggleBusyIcon(false);

			if (err) {
				return console.error(err);
			}

			this.jstree.delete_node(filePath);

			this.updateEvent.emit({
				type: 'delete',
				value: filePath
			});
		});
	}

	private _createFile(filePath) {
		let model =  {
			inputs: [
				{
					value: '',
					type: 'text'
				}
			]
		};

		return new Promise((resolve) => {

			let self = this;

			let dialogComponentRef = this._modalService.create(DialogComponent, {
				type: 'dialog',
				title: 'New file',
				showBackdrop: false,
				showCloseButton: false,
				model: model,
				buttons: [
					{value: 'add', text: 'add', type: 'primary'},
					{text: 'cancel', type: 'candel'}
				],
				onClickButton: (value) => {
					if (value === 'add') {
						this._toggleBusyIcon(true);

						this._socketService.send('editor:file:create', {parent: filePath, name: model.inputs[0].value}, (err, result) => {
							this._toggleBusyIcon(false);

							if (err)
								return alert(err);

							this.jstree.create_node(filePath, {
								id: result.id,
								text: model.inputs[0].value,
								isFile: true,
								icon: 'glyphicon glyphicon-file'
							}, 'inside');

							this.updateEvent.emit({
								type: 'createFile',
								value: model.inputs[0].value
							});
						});
					}
				}
			});
		});
	}

	private _createDirectory(filePath) {
		let model =  {
				inputs: [
					{
						value: '',
						type: 'text'
					}
				]
			};

		let dialogComponentRef = this._modalService.create(DialogComponent, {
			type: 'dialog',
			title: 'New directory',
			showBackdrop: false,
			showCloseButton: false,
			model: model,
			buttons: [
				{value: 'add', text: 'add', type: 'primary'},
				{text: 'cancel', type: 'candel'}
			],
			onClickButton: (value) => {
				if (value === 'add') {
					this._toggleBusyIcon(true);

					this._socketService.send('editor:directory:create', {parent: filePath, name: model.inputs[0].value}, (err, result) => {
						this._toggleBusyIcon(false);

						if (err)
							return alert(err);

						this.updateEvent.emit({
							type: 'createDirectory',
							value: model.inputs[0].value
						});

						this.jstree.create_node(filePath, {
							id: result.id,
							text: model.inputs[0].value,
							isFile: false
						}, 'inside');
					});
				}
			}
		});
	}

	private _toggleBusyIcon(state) {
		$(this._elementRef.nativeElement).find('.spinner').toggle(!!state);
	}

	private _showError(err) {}

	onSwipe(event, phase, direction, distance) {
		console.log(distance);
		console.log(distance);


		if (phase === 'move') {
			if (direction === 'left') {
				this.scrollNav(-distance, 0);
			} else if (direction === 'right') {
				this.scrollNav(distance - 300, 0);
			}
		} else if (phase === 'cancel') {
			this.scrollNav(this.open ? -NAV_WITH : 0, speed);
		} else if (phase === 'end') {
			this.scrollNav(this.open ? -NAV_WITH : 0, speed);
			this.open = !this.open;
		}
	}

	scrollNav(distance, duration) {
		$(this._elementRef.nativeElement).css('transition-duration', (duration / 1000).toFixed(1) + 's');
		// inverse the number we set in the css

		let value = /*(distance < 0 ? '' : '-') + Math.abs(distance).toString();*/


		$(this._elementRef.nativeElement).css('transform', 'translate(' + distance + 'px,0)');
	}


	ngOnDestroy(): void {

	}
}