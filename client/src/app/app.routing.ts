import {RouterModule, Routes} from '@angular/router';
import {ModuleWithProviders} from '@angular/core';
import {LoginComponent} from './components/login/login.component';
import {PageMainComponent} from './components/page-main/page.main.component';
import {AuthGuard} from './guards/auth.guard';
import {RegisterComponent} from './components/register/register.component';
import {UserOverviewComponent} from './components/user-overview/user.overview.component';
import {ChannelOverviewComponent} from './components/channel-overview/channel-overview.component';
import {PortfolioComponent} from './components/portfolio/portfolio.component';
import {ChartOverviewComponent} from './components/chart-overview/chart-overview.component';
import {BacktestComponent} from './components/backtest/backtest.component';
import {JSEditorComponent} from './components/jseditor/jseditor.component';
import {ProfileComponent} from './components/profile/profile.component';
import {PageSubUserComponent} from './components/page-sub-user/page.sub.user.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SocialFeedComponent} from './components/social-feed/social.feed.component';
import {ProfileChannelOverviewComponent} from './components/profile-channel-overview/profile.channel.overview.component';
import {PasswordResetComponent} from "./components/password-reset/password-reset.component";
import {RequestPasswordResetComponent} from "./components/request-password-reset/request-password-reset.component";

const routes: Routes = [
	{path: '', redirectTo: 'main', pathMatch: 'full', canActivate: [AuthGuard]},
	{path: 'login', component: LoginComponent},
	{path: 'register', component: RegisterComponent},
	{path: 'password-reset', component: PasswordResetComponent},
	{path: 'request-password-reset', component: RequestPasswordResetComponent},
	{
		path: 'main', component: PageMainComponent, canActivate: [AuthGuard],
		children: [
			{path: '', redirectTo: 'user', pathMatch: 'full'},
			{path: 'channels', component: ChannelOverviewComponent},
			{path: 'portfolio', component: PortfolioComponent},
			{
				path: 'user', component: PageSubUserComponent, children:
				[
					{path: '', redirectTo: 'overview', pathMatch: 'full'},
					{path: 'overview', component: UserOverviewComponent},
					{
						path: ':id', component: ProfileComponent, children:
						[
							{path: '', redirectTo: 'feed', pathMatch: 'full'},
							{path: 'feed', component: SocialFeedComponent},
							{path: 'channels', component: ProfileChannelOverviewComponent},
						]
					}
				]
			},
			{path: 'charts', component: ChartOverviewComponent},
			{path: 'charts/:id', component: ChartOverviewComponent},
			{path: 'backtest', component: BacktestComponent},
			{path: 'editor', component: JSEditorComponent},
			{path: 'settings', component: SettingsComponent},
		]
	}
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes, {
		useHash: true
	}
);