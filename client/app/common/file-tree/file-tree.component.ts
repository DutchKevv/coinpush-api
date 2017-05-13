import {DialogAnchorDirective} from '../../directives/dialoganchor.directive';
declare let socket: any;
declare let ace: any;
declare let $: any;

import {Component, AfterViewInit, OnDestroy, ElementRef, ViewEncapsulation, ViewChild, Output, EventEmitter} from '@angular/core';
import {SocketService}  from '../../services/socket.service';
import {DialogComponent} from '../dialog/dialog.component';

@Component({
	selector: 'file-tree',
	templateUrl: './file-tree.component.html',
	styleUrls: ['./file-tree.component.scss'],
	encapsulation: ViewEncapsulation.None,
	entryComponents: [DialogComponent]
})

export class FileTreeComponent implements AfterViewInit, OnDestroy {

	@ViewChild(DialogAnchorDirective) private _dialogAnchor: DialogAnchorDirective;
	@Output() updateEvent = new EventEmitter<any>();

	socket: any;
	$el: any;
	jstree: any;

	_firstLoad = true;

	private _data = [];

	constructor(
		private _socketService: SocketService,
		private _elementRef: ElementRef) {
		this.socket = _socketService.socket;

		this.jstree = null;
	}

	ngAfterViewInit(): void {
		this.load();

		this.$el = $('#fileListContainer');

		this._bindContextMenu();

		this._socketService.socket.on('file:list', (err: any, result: any) => {
			this._toggleBusyIcon(false);

			if (err)
				return this._showError(err);

			if (!result)
				return;

			this._data = this._convertData(result);

			if (this.jstree)
				return this.update(this._data);

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

			this.jstree = this.$el.jstree(true);
		});
	}

	public load() {
		this._toggleBusyIcon(true);
		this._socketService.socket.emit('file:list');
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


		this.updateEvent.emit({
			type: 'select',
			value: id
		});
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

		this._dialogAnchor.createDialog(DialogComponent, {
			title: 'New file',
			model: model,
			buttons: [
				{value: 'add', text: 'Add', type: 'primary'},
				{text: 'Cancel', type: 'default'}
			],
			onClickButton: (value) => {
				if (value === 'add') {
					this._toggleBusyIcon(true);

					let newName = model.inputs[0].value;

					// Same as old name
					if (oName === newName)
						return;

					this._socketService.socket.emit('editor:rename', {id: filePath, name: newName}, (err, result) => {
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
	}

	private _delete(filePath) {
		this.jstree.delete_node(filePath);

		// TODO: Show confirmation popup
		this._toggleBusyIcon(true);

		this.socket.emit('editor:file:delete', {filePath: filePath}, (err) => {
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

		this._dialogAnchor.createDialog(DialogComponent, {
			title: 'New file',
			model: model,
			buttons: [
				{value: 'add', text: 'Add', type: 'primary'},
				{text: 'Cancel', type: 'default'}
			],
			onClickButton: (value) => {
				if (value === 'add') {
					this._toggleBusyIcon(true);

					this._socketService.socket.emit('editor:file:create', {parent: filePath, name: model.inputs[0].value}, (err, result) => {
						this._toggleBusyIcon(false);

						if (err)
							return alert(err);

						this.jstree.create_node(filePath, {
							id: result.id,
							text: model.inputs[0].value
						}, 'inside');

						this.updateEvent.emit({
							type: 'createFile',
							value: model.inputs[0].value
						});
					});
				}
			}
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

		this._dialogAnchor.createDialog(DialogComponent, {
			title: 'New directory',
			model: model,
			buttons: [
				{value: 'add', text: 'Add', type: 'primary'},
				{text: 'Cancel', type: 'default'}
			],
			onClickButton: (value) => {
				if (value === 'add') {
					this._toggleBusyIcon(true);

					this._socketService.socket.emit('editor:directory:create', {parent: filePath, name: model.inputs[0].value}, (err, result) => {
						this._toggleBusyIcon(false);

						if (err)
							return alert(err);

						this.jstree.create_node(filePath, {
							id: result.id,
							text: model.inputs[0].value
						}, 'inside');

						this.updateEvent.emit({
							type: 'createDirectory',
							value: model.inputs[0].value
						});
					});
				}
			}
		});
	}

	private _toggleBusyIcon(state) {
		$(this._elementRef.nativeElement).find('.spinner').toggle(!!state);
	}

	private _showError(err) {}

	ngOnDestroy(): void {

	}
}