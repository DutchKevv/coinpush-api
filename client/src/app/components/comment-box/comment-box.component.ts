import {
	ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import { CommentService } from "../../services/comment.service";
import { Subject } from "rxjs";
import { CommentModel } from "../../models/comment.model";
import { UserService } from "../../services/user.service";

@Component({
	selector: 'app-comment-box',
	styleUrls: ['./comment-box.component.scss'],
	templateUrl: 'comment-box.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CommentBoxComponent implements OnInit, OnDestroy {

	@Input() userId: string;
	@Output() public newMessage: EventEmitter<CommentModel> = new EventEmitter();

	@ViewChild('content') private _contentRef: ElementRef;

	public placeholderText: string = 'Share your ideas';

	constructor(private _commentService: CommentService, private _userService: UserService) {
	}

	ngOnInit() {
		// const isSelf = this.userId === this._userService.model.options._id;

		// if (isSelf) {
		// 	this.placeholderText = 'Share your thoughts';
		// } else {
		// 	this.placeholderText = 'Share your thoughts';
		// }
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