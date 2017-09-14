///<reference path="../../../node_modules/@angular/core/src/metadata/view.d.ts"/>
import {Component, AfterViewInit, Output, OnInit, ElementRef, ViewEncapsulation, ViewChild, ChangeDetectionStrategy} from '@angular/core';
import {SocialService} from '../../services/social.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AuthenticationService} from '../../services/authenticate.service';
import {Http} from '@angular/http';
import {Subject} from 'rxjs/Subject';
import {CacheService, CacheSymbol} from '../../services/cache.service';

@Component({
	selector: 'page-sub-user',
	template: '<router-outlet></router-outlet>',
	styleUrls: ['./page.sub.user.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.Native
})

export class PageSubUserComponent {

	constructor() {}
}