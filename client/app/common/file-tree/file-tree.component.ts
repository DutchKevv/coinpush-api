import {DialogAnchorDirective} from '../../directives/dialoganchor.directive';
declare let socket: any;
declare let ace: any;
declare let $: any;

import {Component, AfterViewInit, OnDestroy, ElementRef, ViewEncapsulation, ViewChild} from '@angular/core';
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


	socket: any;

	$el: any;
	jstree: any;
	loaded: boolean;

	constructor(private _socketService: SocketService) {
		this.socket = _socketService.socket;

		this.jstree = null;
		this.loaded = false;
	}

	ngAfterViewInit(): void {
		this.load();

		this.$el = $('#fileListContainer');
		this.$el.off('changed.jstree').on('changed.jstree', this.onChange.bind(this));

		this._bindContextMenu();

		this._socketService.socket.on('file:list', (err: any, result: Object) => {

			if (err)
				return this._showError(err);

			if (!result)
				return;

			if (this.jstree)
				return this.update(result);

			this.$el.jstree({
				plugins: [
					'state',
					'cookies',
					'ui',
					'html_data'
				],
				core: {
					multiple: false,
					data: this.convertData(result),
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
		this._socketService.socket.emit('file:list');
	}

	update(data: Object) {
		let state = this.jstree.get_state();
		this.$el.jstree(true).settings.core.data = this.convertData(data);
		this.$el.jstree('refresh');
		this.jstree.set_state(state);
	}

	onChange(e: any, data: any) {

	}

	convertData(obj: any) {
		obj.text = obj.text || obj.name;
		obj.id = 'file_tree_' + obj.path;
		obj.data = {path: obj.path, isFile: typeof obj.extension !== 'undefined'};

		delete obj.name;

		if (obj.extension) {
			obj.icon = 'glyphicon glyphicon-file';
		}
		if (obj.children) {
			for (let i = 0, len = obj.children.length; i < len; i++) {
				this.convertData.call(this, obj.children[i]);
			}
		}

		return obj;
	}

	private _bindContextMenu() {
		let selected = null;

		this.$el.contextMenu({
			menuSelected: (selectedValue, originalEvent) => {
				let filePath = originalEvent.target.id.split('file_tree_')[1].split('_anchor')[0];

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
						this._createFile();
						break;
					case 'createDirectory':
						this._createDirectory();
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

	private _open(filePath) {

	}

	private _rename(filePath) {
		// TODO: Show new name popup
		let name = 'test';

		this.socket.emit('editor:file:rename', {filePath: filePath, name: name}, (err) => {
			if (err)
				return console.error(err);
		});
	}

	private _delete(filePath) {
		let id = 'file_tree_' + filePath;

		this.jstree.delete_node(id);

		// TODO: Show confirmation popup
		this.socket.emit('editor:file:delete', {filePath: filePath}, (err) => {
			if (err) {
				return console.error(err);
			}
		});
	}

	private _createFile() {

	}

	private _createDirectory() {
		return new Promise((resolve, reject) => {

			let self = this;

			this._dialogAnchor.createDialog(DialogComponent, {
				title: 'New directory',
				model: {
					inputs: [
						{
							value: '',
							type: 'text'
						}
					]
				},
				buttons: [
					{value: 'add', text: 'Add', type: 'primary'},
					{text: 'Cancel', type: 'default'}
				],
				onClickButton(value) {
					if (value === 'add') {
						console.log(this);

						self._socketService.socket.emit('editor:directory:create', (err) => {
							if (err)
								return reject(err);

							resolve(true);
						});
					} else
						resolve(false);
				}
			});
		});
	}

	private _showError(err) {}

	ngOnDestroy(): void {

	}
}