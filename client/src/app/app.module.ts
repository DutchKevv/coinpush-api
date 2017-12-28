import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRouter } from './app.routing';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { AuthGuard } from './guards/auth.guard';
import { UserService } from './services/user.service';
import { LoginComponent } from './components/login/login.component';
import { ConstantsService } from './services/constants.service';
import { ChartBoxComponent } from './components/chart-box/chart-box.component';
import { CacheService } from './services/cache.service';
import { AuthenticationService } from './services/authenticate.service';
import { CustomHttp } from './services/http.service';
import { AlertService } from './services/alert.service';
import { AlertComponent } from './components/alert/alert.component';
import { HttpModule, XHRBackend, RequestOptions, Http } from '@angular/http';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ParseCommentContentPipe, SocialFeedComponent } from './components/social-feed/social.feed.component';
import { CommentBoxComponent } from './components/comment-box/comment-box.component';
import { CommentService } from "./services/comment.service";
import { PasswordResetComponent } from "./components/password-reset/password-reset.component";
import { RequestPasswordResetComponent } from "./components/request-password-reset/request-password-reset.component";
import { BootstrapService } from "./services/bootstrap.service";
import { EventOverviewComponent } from './components/event-overview/event-overview.component';
import { NewsService } from './services/news.service';
import { Router } from '@angular/router';
import { EventService } from './services/event.service';
import { AlarmMenuComponent } from './components/alarm-menu/alarm-menu.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
	declarations: [
		AppComponent,
		AlarmMenuComponent,
		ChartBoxComponent,
		ChartOverviewComponent,
		EventOverviewComponent,
		ParseCommentContentPipe,
		SocialFeedComponent,
		LoginComponent,
		PasswordResetComponent,
		RequestPasswordResetComponent,
		AlertComponent,
		UserOverviewComponent,
		ProfileComponent,
		SettingsComponent,
		CommentBoxComponent
	],
	imports: [
		BrowserModule,
		AppRouter,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		NgbModule.forRoot()
	],
	providers: [
		BootstrapService,
		AuthGuard,
		AlertService,
		UserService,
		CommentService,
		NewsService,
		EventService,
		{ provide: APP_INITIALIZER, useFactory: (config: BootstrapService) => () => config.load(), deps: [BootstrapService], multi: true },
		{ provide: AuthenticationService, useClass: AuthenticationService },
		{
			provide: Http,
			useFactory: (backend: XHRBackend, options: RequestOptions, route: Router, inj: Injector) => {
				return new CustomHttp(backend, options, route, inj);
			},
			deps: [XHRBackend, RequestOptions, Router, Injector]
		},
		{ provide: ConstantsService, useClass: ConstantsService },
		{ provide: CacheService, useClass: CacheService }
	],
	bootstrap: [
		AppComponent
	],

	entryComponents: [LoginComponent]
})

export class AppModule {
}