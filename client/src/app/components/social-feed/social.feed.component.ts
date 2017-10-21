import {
	ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnInit, Output,
	ViewEncapsulation
} from '@angular/core';
import {UserService} from '../../services/user.service';
import {Http} from '@angular/http';
import {FormBuilder} from '@angular/forms';
import {ActivatedRoute} from "@angular/router";
import {CommentService} from "../../services/comment.service";
import {Subject} from "rxjs/Subject";
import {CommentModel} from "../../models/comment.model";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Component({
	selector: 'app-social-feed',
	styleUrls: ['./social.feed.component.scss'],
	templateUrl: 'social.feed.component.html',
	encapsulation: ViewEncapsulation.Native,
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class SocialFeedComponent implements OnInit {

	@Input() model;
	@Output() comments$: BehaviorSubject<Array<CommentModel>> = new BehaviorSubject([]);


	channelId: string;

	constructor(private _route: ActivatedRoute,
				public commentService: CommentService,
				public userService: UserService) {
	}

	async ngOnInit() {
		this.channelId = this._route.parent.params['_value'].id;

		this.comments$.next(await this.commentService.findByChannelId(this.channelId));
	}

	focusInput(event) {
		event.currentTarget.parentNode.parentNode.querySelector('input').focus();
	}

	async respond(event, parentId) {
		const input = event.currentTarget;
		const comment = await this.commentService.create(this.channelId, parentId, input.value);

		if (!comment)
			return;

		input.value = '';

		this.addMessage(comment);
		// this.newMessage.emit(comment);
	}

	addMessage(model) {
		const current = Array.from(this.comments$.getValue());

		if (model.options.parentId)
			current.find(c => c.options._id === model.options.parentId).options.children.push(model);
		else
			current.unshift(model);

		this.comments$.next(current);

	}

	onChangeFileInput(event) {

	}
}