import {
	ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,
	ViewEncapsulation
} from '@angular/core';
import { CommentService } from "../../services/comment.service";
import { Subject, BehaviorSubject } from "rxjs";
import { CommentModel } from "../../models/comment.model";
import { UserService } from "../../services/user.service";
import { HttpClient } from '@angular/common/http';

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
	@ViewChild('uploadBtn') uploadBtn: ElementRef;

	public placeholderText: string = 'Share your ideas';
	public images$ = new BehaviorSubject([]);

	constructor(
		private _commentService: CommentService, 
		private _userService: UserService,
		private _http: HttpClient
		) {
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

		const comment = await this._commentService.create(this.userId, null, value, this.images$.getValue());

		if (!comment)
			return;

		this.images$.next([])
		this._contentRef.nativeElement.value = '';
		this.newMessage.emit(comment);
	}


	public clean() {

	}

	public onChangeFileInput(event) {
		const input = event.target;

		// this.toggleSaveOptionsVisibility(input.files && input.files[0]);

		if (input.files && input.files[0]) {
			let reader = new FileReader();

			// !local! image ready 
			// reader.onload = (e) => this.setProfileImgPreview(e.target['result']);

			// read !local! image
			reader.readAsDataURL(input.files[0]);
			this.saveImg();
		}
	}

	public async saveImg() {
		// this.toggleSaveOptionsVisibility(false);

		// this.uploadImageLoading.nativeElement.classList.add('active');

		let data = new FormData();
		data.append('image', this.uploadBtn.nativeElement.files.item(0));

		try {
			// upload profile image
			const result: any = await this._http.post('/upload/comment', data).toPromise();

			const images = this.images$.getValue();
			images.push(result.url);
			this.images$.next(images);

			// store locally (skip re-sending to server)
			// this._accountService.update({ img: result.url }, false);

		} catch (result) {
			switch (result.status) {
				case 413:
					// this._alertService.error(result.error.message || 'Max file reached');
					break;
				default:
					// this._alertService.error('Error uploading image');
					console.error(result)
			}
		} finally {
			// this.uploadImageLoading.nativeElement.classList.remove('active');
		}
	}

	ngOnDestroy() {

	}
}