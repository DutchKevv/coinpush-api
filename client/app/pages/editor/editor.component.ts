import {SocketService} from '../../services/socket.service';
declare let $: any;

import {Component, ViewChild, AfterViewInit, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import {FileTreeComponent}  from '../../components/file-tree/file-tree.component';
import {JSEditorComponent}  from '../../components/jseditor/jseditor.component';

@Component({
	selector: 'page-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})

export class EditorComponent implements AfterViewInit {

	// we pass the Component we want to get
	// assign to a public property on our class
	// give it the type for our component
	@ViewChild(FileTreeComponent) fileTree: FileTreeComponent;
	@ViewChild(JSEditorComponent) jsEditor: JSEditorComponent;

	public zoom = 1;

	constructor(private _elementRef: ElementRef,
				private _router: Router,
				private _socketService: SocketService) {
	}

	ngAfterViewInit(): void {
		this._socketService.socket.on('editor:change', () => {
			// this.fileTree.load();
			// this.jsEditor.reloadCurrentFile();
		});

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
}