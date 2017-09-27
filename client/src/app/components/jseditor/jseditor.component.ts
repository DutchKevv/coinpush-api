import {FileTreeComponent} from '../file-tree/file-tree.component';

declare var ace: any;
declare var $: any;

import {
	Component, AfterViewInit, ElementRef, ViewEncapsulation, NgZone, ChangeDetectorRef,
	ViewChild
} from '@angular/core';
import {SocketService} from '../../services/socket.service';
// import '../../../assets/vendor/js/ace/ace.js';
// import '../../../assets/vendor/js/ace/theme-tomorrow_night_bright.js';

@Component({
	selector: 'js-editor',
	templateUrl: './jseditor.component.html',
	styleUrls: ['./jseditor.component.scss']
	// encapsulation: ViewEncapsulation.Native
})

export class JSEditorComponent implements AfterViewInit {

	@ViewChild(FileTreeComponent) fileTree: FileTreeComponent;
	@ViewChild('editor') editorRef: ElementRef;

	editor: any;
	text = '';

	ace: any;
	currentFile: any;
	socket: any;

	bannerState: string;
	bannerText: string;

	private _$el;
	private _$banner;
	private _fileTreeSubscription;

	constructor(private _zone: NgZone,
				private _ref: ChangeDetectorRef,
				private _socketService: SocketService,
				private _elementRef: ElementRef) {}

	ngAfterViewInit() {
		this._$el = $(this._elementRef.nativeElement);
		this._$banner = this._$el.find('.banner');
		// this._editorEl = this._$el.find('.editor')[0];

		this.setEditor();

		this._fileTreeSubscription = this.fileTree.updateEvent$.subscribe(event => this.fileTreeUpdate(event));

		this.fileTree.$el.off('select_node.jstree').on('select_node.jstree', (e: any, data: any) => {
			if (data.node && data.node.original.isFile) {
				let path = this.fileTree.$el.jstree(true).get_path(data.node, '/');
			}
		});
	}

	fileTreeUpdate(event) {
		switch (event.type) {
			case 'select':
				this.loadFile(event.value);
				break;
			case 'delete':
				break;
			case 'createFile':
				this.loadFile(event.value);
				break;
			case 'createDirectory':
				break;
			case 'rename':
				break;
			default:
				throw new Error('Unknown fileTree update event');
		}
	}

	onBlur() {
		if (!this.editor.session.getUndoManager().isClean()) {
			this.saveFile();
		}
	}

	setEditor() {
		this._zone.runOutsideAngular(() => {
			ace.require('ace/config').set('workerPath', '/assets222/js/ace/');

			this.editor = ace.edit(this.editorRef.nativeElement);
			// this.editor.setAutoScrollEditorIntoView(true);
			this.editor.$blockScrolling = Infinity;
			// this.editor.setOption('minLines', 100);
			// this.editor.setOption('maxLines', 200);
			this.editor.setOptions({
				maxLines: Infinity
			});
			this.editor.setTheme('ace/theme/tomorrow_night_bright');
			this.editor.getSession().setMode('ace/mode/typescript');

			this.editor.commands.addCommand({
				name: 'saveFile',
				bindKey: {
					win: 'Ctrl-S',
					mac: 'Command-S',
					sender: 'editor|cli'
				},
				exec: (env, args, request) => {
					this.saveFile();
				}
			});

			this.editor.on('blur', this.onBlur.bind(this));
		})
	}

	loadFile(id: any, focus = true) {
		this.currentFile = id;

		this._socketService.send('file:load', {id: id}, (err: any, result: any) => {
			try {
				this.editor.session.setValue(result || '');

				if (focus) {
					this.editor.focus();

					// TODO: Store last used line number
					// this.editor.gotoLine(n); //Go to end of document
				}
			} catch (err) {
				console.log(err);
			}
		});
	}


	reloadCurrentFile() {
		this.loadFile(this.currentFile);
	}

	saveFile() {
		return new Promise((resolve, reject) => {
			if (!this.editor.session.getUndoManager().isClean()) {
				this.editor.session.getUndoManager().markClean();

				let content = this.editor.getValue();

				this._socketService.send('file:save', {path: this.currentFile, content: content}, (err) => {
					if (err) {
						this.showBanner('error', 'File not saved: ' + err);
						return reject();
					}

					this.showBanner('success', 'File saved');
					this._ref.markForCheck();
					resolve();
				});
			}
		});
	}

	showBanner(state: string, text: string) {
		this.bannerState = state;
		this.bannerText = text;

		requestAnimationFrame(() => {
			this._$banner.addClass('fade-in');

			setTimeout(() => {
				this._$banner.removeClass('fade-in');
			}, 5000)
		});
	}
}