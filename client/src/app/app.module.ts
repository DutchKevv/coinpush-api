// Lib
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { SocketService } from './services/socket.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRouter } from './app.routing';

import { MultiselectDropdownModule } from 'angular-2-dropdown-multiselect';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { AuthGuard } from './guards/auth.guard';
import { UserService } from './services/user.service';
import { LoginComponent } from './components/login/login.component';
import { ConstantsService } from './services/constants.service';
import { DialogComponent } from './components/dialog/dialog.component';
import { ModalComponent } from './components/modal/modal.component';
import { DialogAnchorDirective } from './directives/dialoganchor.directive';
import { ModalAnchorDirective } from './directives/modalanchor.directive';
import { ModalService } from './services/modal.service';
import { ResizableDirective } from './directives/resizable.directive';
import { ChartBoxComponent } from './components/chart-box/chart-box.component';
import { CacheService } from './services/cache.service';
import { AuthenticationService } from './services/authenticate.service';
import { CustomHttp } from './services/http.service';
import { AlertService } from './services/alert.service';
import { AlertComponent } from './components/alert/alert.component';
import { RegisterComponent } from './components/register/register.component';
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

@NgModule({
	declarations: [
		AppComponent,
		ChartBoxComponent,
		ChartOverviewComponent,
		DialogAnchorDirective,
		DialogComponent,
		EventOverviewComponent,
		ParseCommentContentPipe,
		SocialFeedComponent,
		LoginComponent,
		PasswordResetComponent,
		RequestPasswordResetComponent,
		RegisterComponent,
		ModalComponent,
		ModalAnchorDirective,
		ResizableDirective,
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
		MultiselectDropdownModule,
	],
	providers: [
		AuthGuard,
		AlertService,
		UserService,
		CommentService,
		BootstrapService,
		NewsService,
		EventService,
		{ provide: AuthenticationService, useClass: AuthenticationService },
		{
			provide: Http,
			useFactory: (backend: XHRBackend, options: RequestOptions, route: Router, inj: Injector) => {
				return new CustomHttp(backend, options, route, inj);
			},
			deps: [XHRBackend, RequestOptions, Router, Injector]
		},
		{ provide: ConstantsService, useClass: ConstantsService },
		{ provide: SocketService, useClass: SocketService },
		{ provide: ModalService, useClass: ModalService },
		{ provide: CacheService, useClass: CacheService }
	],
	bootstrap: [
		AppComponent
	],

	entryComponents: [DialogComponent, LoginComponent]
})

export class AppModule {
}