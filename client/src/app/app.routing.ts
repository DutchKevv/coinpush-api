import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { UserOverviewComponent } from './components/user-overview/user.overview.component';
import { ChannelOverviewComponent } from './components/channel-overview/channel-overview.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { ChartOverviewComponent } from './components/chart-overview/chart-overview.component';
import { BacktestComponent } from './components/backtest/backtest.component';
import { JSEditorComponent } from './components/jseditor/jseditor.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SocialFeedComponent } from './components/social-feed/social.feed.component';
import { ProfileChannelOverviewComponent } from './components/profile-channel-overview/profile.channel.overview.component';
import { PasswordResetComponent } from "./components/password-reset/password-reset.component";
import { RequestPasswordResetComponent } from "./components/request-password-reset/request-password-reset.component";
import { EventOverviewComponent } from './components/event-overview/event-overview.component';

const routes: Routes = [
	{ path: '', redirectTo: 'charts', pathMatch: 'full', canActivate: [AuthGuard] },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'password-reset', component: PasswordResetComponent },
	{ path: 'request-password-reset', component: RequestPasswordResetComponent },

	{ path: 'comment/:id', component: SocialFeedComponent, canActivate: [AuthGuard] },
	{ path: 'channels', component: ChannelOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'portfolio', component: PortfolioComponent, canActivate: [AuthGuard] },
	{ path: 'user', component: UserOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'calendar', component: EventOverviewComponent, canActivate: [AuthGuard] },
	{
		path: 'user/:id', component: ProfileComponent, children:
			[
				{ path: '', redirectTo: 'feed', pathMatch: 'full' },
				{ path: 'feed', component: SocialFeedComponent },
				{ path: 'channels', component: ProfileChannelOverviewComponent },
			]
	},
	{ path: 'charts', component: ChartOverviewComponent, canActivate: [AuthGuard] },
	{ path: 'backtest', component: BacktestComponent, canActivate: [AuthGuard] },
	{ path: 'editor', loadChildren: './components/jseditor/jseditor.module#JSEditorModule', canActivate: [AuthGuard] },
	{ path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
];

export const AppRouter: ModuleWithProviders = RouterModule.forRoot(routes, {
	useHash: true,
});