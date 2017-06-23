// Lib
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

// Pages
import {HomeComponent}    from './pages/home/home.component';
import {EditorComponent}  from './pages/editor/editor.component';

// Components
import {HeaderHomeComponent}  from './components/header-home/header-home.component';
import {HeaderEditorComponent}  from './components/header-editor/header-editor.component';
import {FooterComponent}  from './components/footer/footer.component';
import {FileTreeComponent}  from './components/file-tree/file-tree.component';
import {JSEditorComponent}  from './components/jseditor/jseditor.component';

// Providers
import {SocketService} from './services/socket.service';
import {CookieModule} from 'ngx-cookie';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppComponent} from './app.component';
import {routing} from './app.routing';

import {MultiselectDropdownModule} from 'angular-2-dropdown-multiselect';
import {InstrumentListComponent, SearchFilter} from './components/intrument-list/instrument-list.component';
import {ChartOverviewComponent} from './components/chart-overview/chart-overview.component';
import {LoggedInGuard} from './guards/loggedin.guard';
import {UserService} from './services/user.service';
import {LoginComponent} from './components/login/login.component';
import {StatusComponent} from './components/status/status.component';
import {SystemService} from './services/system.service';
import {ConstantsService} from './services/constants.service';
import {DialogComponent} from './components/dialog/dialog.component';
import {ModalComponent} from './components/modal/modal.component';
import {DialogAnchorDirective} from './directives/dialoganchor.directive';
import {ModalAnchorDirective} from './directives/modalanchor.directive';
import {ModalService} from './services/modal.service';
import {InstrumentsService} from './services/instruments.service';
import {ResizableDirective} from './directives/resizable.directive';
import {ChartBoxComponent} from './components/chart-box/chart-box.component';
import {BacktestSettingsComponent, GroupByPipe} from './components/backtest-settings/backtest-settings.component';
import {BacktestReportComponent} from './components/backtest-report/backtest-report.component';
import {CacheService} from './services/cache.service';
import {BacktestComponent, GroupIdsPipe} from './components/backtest/backtest.component';
import {CoreListComponent} from "./components/core-list/core-list.component";

@NgModule({
	declarations: [
		AppComponent,
		BacktestComponent,
		BacktestReportComponent,
		BacktestSettingsComponent,
		ChartBoxComponent,
		ChartOverviewComponent,
		DialogAnchorDirective,
		DialogComponent,
		EditorComponent,
		FileTreeComponent,
		FooterComponent,
		GroupByPipe,
		GroupIdsPipe,
		HeaderHomeComponent,
		HeaderEditorComponent,
		HomeComponent,
		InstrumentListComponent,
		JSEditorComponent,
		LoginComponent,
		ModalComponent,
		ModalAnchorDirective,
		ResizableDirective,
		SearchFilter,
		StatusComponent,
		CoreListComponent
	],
	imports: [
		BrowserModule,
		CookieModule.forRoot(),
		routing,
		FormsModule,
		ReactiveFormsModule,
		MultiselectDropdownModule
	],
	providers: [
		{provide: UserService, useClass: UserService},
		{provide: SystemService, useClass: SystemService},
		{provide: LoggedInGuard, useClass: LoggedInGuard},
		{provide: ConstantsService, useClass: ConstantsService},
		{provide: SocketService, useClass: SocketService},
		{provide: ModalService, useClass: ModalService},
		{provide: InstrumentsService, useClass: InstrumentsService},
		{provide: CacheService, useClass: CacheService}
	],
	bootstrap: [
		AppComponent
	],

	entryComponents: [DialogComponent]
})

export class AppModule {
}