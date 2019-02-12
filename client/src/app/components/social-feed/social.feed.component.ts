import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Pipe, PipeTransform, OnDestroy, ChangeDetectorRef, ViewEncapsulation, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ActivatedRoute } from "@angular/router";
import { CommentService } from "../../services/comment.service";
import { BehaviorSubject } from "rxjs";
import { CommentModel } from "../../models/comment.model";
import { CacheService } from '../../services/cache.service';
import { ConfigService } from '../../services/config/config.service';
import { AccountService } from '../../services/account/account.service';

const MAX_COMMENT_LENGTH = 400;
const SCROLL_LOAD_TRIGGER_OFFSET = 800;

// function shortify(inputText: string) {
// 	if (inputText.length > 100) {
// 		const preText = inputText.substring(0, 100);
// 		inputText = preText + '<a>sdf</a><span style="display: none">' + inputText.substring(100) + '</span>';
// 	}

// 	return inputText;
// }

export class FilterModel {
	sources = [];
	// sources = app.data.config.companyUsers.map(user => {user.enabled = true; return user});
}

@Component({
	selector: 'app-social-feed',
	styleUrls: ['./social.feed.component.scss'],
	templateUrl: 'social.feed.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialFeedComponent implements OnInit, OnDestroy, OnChanges {

	@Input() public scrollHandle: HTMLElement;
	@Input() public filterModel: FilterModel;

	public comments$: BehaviorSubject<Array<CommentModel>> = new BehaviorSubject([]);
	public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

	public userId: string;
	public commentId: string;

	private _routeParamsSub;
	private _offset = 0;
	private _onScrollBinded = this._onScroll.bind(this);

	constructor(
		public commentService: CommentService,
		public changeDetectorRef: ChangeDetectorRef,
		public accountService: AccountService,
		private _elementRef: ElementRef,
		private _configService: ConfigService,
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

		this.bindScroll(this.scrollHandle);
	}

	ngOnChanges(changes: SimpleChanges) {
		
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

	public bindScroll(scrollHandle?: HTMLElement) {
		this.scrollHandle = scrollHandle || this._elementRef.nativeElement;
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
		const comment = await this.commentService.create(parentModel.options.toUser, parentModel.options._id, input.value, []);
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

	public reload(): Promise<void> {
		this._offset = 0;
		this.comments$.next([]);
		return this._load();
	}

	private async _load(): Promise<void> {
		const urlPath = this._route.snapshot.url[0].path;
		let items = [];

		this.isLoading$.next(true);

		switch (urlPath) {
			case 'user':
				items = await this.commentService.findByUserId(this.userId, this._offset);
				break;
			case 'comment':
				items = [await this.commentService.findById(this.commentId)];
				break;
			default:
				// set filter options
				const options: any = {
					offset: this._offset
				};

				if (this.filterModel) {
					options.sources = this.filterModel.sources.filter(source => source.enabled).map(source => source._id);
				}

				items = await this.commentService.findTimeline(options);
		}

		this.isLoading$.next(false);

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
	private _mixComments(comments: Array<CommentModel>): void {
		let risersFallersNr = Math.floor(comments.length / 5);
		const positions = [];

		while (risersFallersNr-- > 0) {
			const randomPosition = getRandomNumber(comments.length, positions);
			positions.push(randomPosition);
			this._mixRiserFallers(comments, randomPosition);
		}

		this._mixAds(comments);
	}

	private _mixAds(comments: Array<CommentModel>): void {
		if (this._configService.platform.isApp) {
			// const banner = window['AdMob'].createBanner({
			// 	adSize: window['AdMob'].AD_SIZE.MEDIUM_RECTANGLE,
			// 	overlap: true,
			// 	// height: 60, // valid when set adSize 'CUSTOM'
			// 	adId: 'ca-app-pub-1181429338292864/6989656167',
			// 	position: window['AdMob'].AD_POSITION.BOTTOM_CENTER,
			// 	autoShow: true,
			// 	isTesting: true
			// });

			// console.log(banner);
		} else {
			const ad = new CommentModel({
				type: 'ad',
				content: 'DFDFDF'
			});

			comments.push(ad);

			setTimeout(() => {
				(window['adsbygoogle'] = window['adsbygoogle'] || []).push({
					google_adtest: 'on'
				});
			}, 1000);

		}
	}

	// risers and fallers
	private _mixRiserFallers(comments: Array<CommentModel>, position?: number): void {
		position = position || getRandomNumber(comments.length);

		const sortedByDayAmount = this._cacheService.symbols.sort((a, b) => a.options.changedDAmount - b.options.changedDAmount);
		const risers = sortedByDayAmount.slice(-20);
		const fallers = sortedByDayAmount.slice(0, 20)
		const randomUpSymbolModel = risers[Math.floor(Math.random() * risers.length)];
		const randomDownSymbolModel = fallers[Math.floor(Math.random() * fallers.length)];

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

	private _onScroll(event): void {
		if (!this.isLoading$.getValue() && event.target.scrollHeight - event.target.scrollTop - SCROLL_LOAD_TRIGGER_OFFSET <= event.target.clientHeight)
			this._load();
	}

	private _toggleLoading(state: boolean) {

	}

	ngOnDestroy() {
		this.unbindScroll();

		if (this._routeParamsSub)
			this._routeParamsSub.unsubscribe();
	}
}

@Pipe({ name: 'parseCommentContent' })
export class ParseCommentContentPipe implements PipeTransform {
	transform(value: string, field: string): string {
		value = linkify(value);

		if (value.length > MAX_COMMENT_LENGTH)
			return value.substring(0, MAX_COMMENT_LENGTH) + ' ...';

		return value;
	}
}

const AD_ARTICLE_HTML = `
		<ins class="adsbygoogle" style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="ca-pub-1181429338292864"
		 data-ad-slot="5683371400"></ins>
		 `;

const AD_FEED_HTML = `
		<ins class="adsbygoogle" style="display:block;" data-ad-format="fluid" data-ad-layout-key="-6t+ed+2i-1n-4w" data-ad-client="ca-pub-1181429338292864"
		  data-ad-slot="6793790015" data-adtest="on"></ins>
		`;

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

function getRandomNumber(until: number, without: Array<number> = []) {
	let number, maxTries = 10, i = 0;

	do {
		number = Math.floor(Math.random() * until) + 1;
	} while (i++ < maxTries && without.includes(number));

	return number;
}