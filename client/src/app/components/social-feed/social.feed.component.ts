import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Pipe, PipeTransform, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from "@angular/router";
import { CommentService } from "../../services/comment.service";
import { BehaviorSubject } from "rxjs";
import { CommentModel } from "../../models/comment.model";
import { CacheService } from '../../services/cache.service';

const MAX_COMMENT_LENGTH = 200;
const SCROLL_LOAD_TRIGGER_OFFSET = 400;

function linkify(inputText) {
	var replacedText, replacePattern1, replacePattern2, replacePattern3;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank" class="g-link">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank" class="g-link">$2</a>');

	//Change email addresses to mailto:: links.
	replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
	replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1" class="g-link">$1</a>');

	return replacedText;
}

function getRandomNumber(until: number, without?: Array<number>) {
	let number, maxtries = 10, i = 0;

	do {
		number = Math.floor(Math.random() * until) + 1;
	} while (i++ < maxtries && !without.includes(number));

	return number;
}

// function shortify(inputText: string) {
// 	if (inputText.length > 100) {
// 		const preText = inputText.substring(0, 100);
// 		inputText = preText + '<a>sdf</a><span style="display: none">' + inputText.substring(100) + '</span>';
// 	}

// 	return inputText;
// }

@Pipe({ name: 'parseCommentContent' })
export class ParseCommentContentPipe implements PipeTransform {
	transform(value: string, field: string): string {
		value = linkify(value);

		if (value.length > MAX_COMMENT_LENGTH)
			return value.substring(0, MAX_COMMENT_LENGTH) + ' ...';

		return value;
	}
}


@Component({
	selector: 'app-social-feed',
	styleUrls: ['./social.feed.component.scss'],
	templateUrl: 'social.feed.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialFeedComponent implements OnInit, OnDestroy {

	@Input() public scrollHandle: HTMLElement;

	public comments$: BehaviorSubject<Array<CommentModel>> = new BehaviorSubject([]);
	public isLoading: boolean = true;
	public filterModel: any = {
		type: 'all'
	};

	public userId: string;
	public commentId: string;

	private _routeParamsSub;
	private _offset = 0;
	private _onScrollBinded = this._onScroll.bind(this);

	constructor(
		public commentService: CommentService,
		public changeDetectorRef: ChangeDetectorRef,
		public _router: Router,
		public userService: UserService,
		private _route: ActivatedRoute,
		private _cacheService: CacheService) {
	}

	ngOnInit() {
		switch (this._route.snapshot.url[0].path) {
			case 'user':
				this.userId = this._route.snapshot.params['id'];
				break;
			case 'comment':
				this.commentId = this._route.snapshot.params['id'];
				break;
		}

		this._load();

		if (this.scrollHandle) {
			this.bindScroll(this.scrollHandle);
		}
	}

	public focusInput(event) {
		event.currentTarget.parentNode.parentNode.querySelector('input').focus();
	}

	public addMessage(model) {
		const current = Array.from(this.comments$.getValue());

		if (model.options.parentId)
			current.find(c => c.options._id === model.options.parentId).options.children.push(model);
		else
			current.unshift(model);

		this.comments$.next(current);
	}

	public async toggleLike(model: CommentModel) {
		await this.commentService.toggleLike(model);
		this.changeDetectorRef.detectChanges();
	}

	public bindScroll(handle: HTMLElement) {
		this.scrollHandle = handle;
		this.scrollHandle.addEventListener('scroll', this._onScrollBinded, { passive: true });
	}

	public unbindScroll() {
		if (this.scrollHandle) {
			this.scrollHandle.removeEventListener('scroll', this._onScrollBinded);
		}
	}

	public async respond(event, parentModel: CommentModel) {
		const input = event.currentTarget;
		input.setAttribute('disabled', true);
		const comment = await this.commentService.create(parentModel.options.toUser, parentModel.options._id, input.value);
		input.removeAttribute('disabled');

		if (!comment)
			return;

		parentModel.options.childCount++;
		input.value = '';

		this.addMessage(comment);
	}

	public onChangeFileInput(event) {

	}

	public showMorePostActions(comment: CommentModel) {
		console.log('more')
	}

	public showMoreCommentActions(comment: CommentModel) {
		console.log('more')
	}

	public trackByFn(index, item) {
		return item.options._id; // or item.id
	}


	public async loadMoreChildren(parentModel: CommentModel): Promise<void> {
		const children = <any>await this.commentService.findChildren(parentModel.options._id, parentModel.options.children.length);
		parentModel.options.children = children.concat(parentModel.options.children);
		this.changeDetectorRef.detectChanges();
	}

	public onClickShowMoreText(model: CommentModel, event): void {
		event.target.previousElementSibling.innerHTML = linkify(model.options.content);
		event.target.parentNode.removeChild(event.target);
	}

	private async _load(): Promise<void> {
		const urlPath = this._route.snapshot.url[0].path;
		let items = [];

		this.isLoading = true;

		switch (urlPath) {
			case 'user':
				items = await this.commentService.findByUserId(this.userId, this._offset);
				break;
			case 'comment':
				items = [await this.commentService.findById(this.commentId)];
				break;
			default:
				items = await this.commentService.findTimeline(this._offset);
		}

		this.isLoading = false;

		if (!items.length) {
			this.unbindScroll();
			return;
		}

		// keep track of current offset
		// TODO: Should be timestamp!
		this._offset += items.length;

		// add 'special' comments (alerts, advertising)
		if (urlPath !== 'comment') {
			this._mixComments(items);
		}

		this.comments$.next(this.comments$.getValue().concat(items));
	}

	/**
	 * Add advertisings, alerts etc in between comments
	 * @param comments 
	 */
	private _mixComments(comments: Array<CommentModel>): Array<CommentModel> {
		let risersFallersNr = Math.floor(comments.length / 5);
		const positions = [];
		
		while(risersFallersNr-- > 0) {
			positions.push(getRandomNumber(comments.length, positions));
			this._mixRiserFallers(comments, positions[positions.length - 1]);
		}
		
		return comments;
	}

	private _onScroll(event): void {
		if (!this.isLoading && event.target.scrollHeight - event.target.scrollTop - SCROLL_LOAD_TRIGGER_OFFSET <= event.target.clientHeight)
			this._load();
	}

	private _toggleLoading(state: boolean) {

	}

	// risers and fallers
	private _mixRiserFallers(comments: Array<CommentModel>, position?: number): void {
		position = position || getRandomNumber(comments.length) + 1;

		const sortedByDayAmount = this._cacheService.symbols.sort((a, b) => a.options.changedDAmount - b.options.changedDAmount);
		const risers = sortedByDayAmount.slice(-20);
		const fallers = sortedByDayAmount.slice(0, 20)
		const randomUpSymbolModel = risers[Math.floor(Math.random()*risers.length)];
		const randomDownSymbolModel = fallers[Math.floor(Math.random()*fallers.length)];

		const commentModel = new CommentModel({
			data: {
				symbolUpModel: randomUpSymbolModel,
				symbolDownModel: randomDownSymbolModel
			},
			type: 'intel-momentum',
			content: ''
		});
		
		comments.splice(position, 0, commentModel);
	}

	ngOnDestroy() {
		this.unbindScroll();

		if (this._routeParamsSub)
			this._routeParamsSub.unsubscribe();
	}
}