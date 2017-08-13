import {SocketService} from '../../services/socket.service';
declare let $: any;

import {Component, ViewChild, AfterViewInit, ElementRef, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {FileTreeComponent}  from '../file-tree/file-tree.component';
import {JSEditorComponent}  from '../jseditor/jseditor.component';

@Component({
	selector: 'page-editor',
	templateUrl: './page.editor.component.html',
	styleUrls: ['./page.editor.component.scss']
})

export class PageEditorComponent implements AfterViewInit, OnDestroy {

	@ViewChild(FileTreeComponent) fileTree: FileTreeComponent;
	@ViewChild(JSEditorComponent) jsEditor: JSEditorComponent;

	public zoom = 1;

	private _fileTreeSubscription;

	constructor(private _elementRef: ElementRef,
				private _router: Router,
				private _socketService: SocketService) {
	}

	ngAfterViewInit(): void {
		this._socketService.socket.on('editor:change', () => {
			// this.fileTree.load();
			// this.jsEditor.reloadCurrentFile();
		});

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
				this.jsEditor.loadFile(event.value);
				break;
			case 'delete':
				break;
			case 'createFile':
				this.jsEditor.loadFile(event.value);
				break;
			case 'createDirectory':
				break;
			case 'rename':
				break;
			default:
				throw new Error('Unknown fileTree update event');
		}
	}

	ngOnDestroy() {
		this._fileTreeSubscription.unsubscribe();
	}
}