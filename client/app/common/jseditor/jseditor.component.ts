declare var ace: any;
declare var $: any;

import {Component, AfterViewInit, ElementRef} from '@angular/core';
import {SocketService} from '../../services/socket.service';

@Component({
	selector: 'js-editor',
	templateUrl: './jseditor.component.html',
	styleUrls: ['./jseditor.component.scss']
})

export class JSEditorComponent implements AfterViewInit {
	editor: any;
	text = '';

	ace: any;
	currentFile: any;
	socket: any;

	bannerState: string;
	bannerText: string;

	private _$el;
	private _$banner;
	private _editorEl: HTMLElement;

	constructor(private _elementRef: ElementRef, socket: SocketService) {
		this.socket = socket.socket;
	}

	ngAfterViewInit() {
		this._$el = $(this._elementRef.nativeElement);
		this._$banner = this._$el.find('.banner');
		this._editorEl = this._$el.find('.editor')[0];

		this.setEditor();
	}

	onBlur() {
		if (!this.editor.session.getUndoManager().isClean()) {
			this.saveFile();
		}
	}

	setEditor() {
		ace.require('ace/config').set('workerPath', '/assets/js/ace/');

		this.editor = ace.edit(this._editorEl);
		this.editor.setAutoScrollEditorIntoView(true);
		// this.editor.setOption('minLines', 100);
		this.editor.setOption('maxLines', 200);
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
	}

	loadFile(id: any, focus = true) {
		this.currentFile = id;

		this.socket.emit('file:load', {id: id}, (err: any, result: any) => {
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
			let content = this.editor.getValue();

			this.socket.emit('file:save', {path: this.currentFile, content: content}, (err) => {
				if (err) {
					this.showBanner('error', 'File not saved: ' + err);
					return reject();
				}

				this.showBanner('success', 'File saved');
				resolve();
			});
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