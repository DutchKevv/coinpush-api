import {
	ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import {CommentService} from "../../services/comment.service";
import {Subject} from "rxjs/Subject";
import {CommentModel} from "../../models/comment.model";
import {UserService} from "../../services/user.service";

@Component({
	selector: 'app-comment-box',
	styleUrls: ['./comment-box.component.scss'],
	templateUrl: 'comment-box.component.html',
	// encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBoxComponent implements OnInit, OnDestroy {

	@Input() userId: string;

	@Output() public newMessage: EventEmitter<CommentModel> = new EventEmitter();

	@ViewChild('content') private _contentRef: ElementRef;


	constructor(private _commentService: CommentService, private _userService: UserService) {
	}

	ngOnInit() {

	}

	public async post(): Promise<void> {
		const value = this._contentRef.nativeElement.value.trim();

		if (!value)
			return;

		const comment = await this._commentService.create(this.userId, null, value);

		if (!comment)
			return;

		this._contentRef.nativeElement.value = '';
		this.newMessage.emit(comment);
	}


	public clean() {

	}

	ngOnDestroy() {

	}
}