import {
	Component, OnInit, ElementRef, ChangeDetectionStrategy,
	ViewChild,
	ChangeDetectorRef,
	AfterViewInit,
	Output,
	OnDestroy,
	ApplicationRef,
	EventEmitter,
	ViewEncapsulation
} from '@angular/core';
import { CacheService } from '../../services/cache.service';
import { UserService } from '../../services/user.service';
import { SymbolModel } from '../../models/symbol.model';
import { SymbolListService } from '../../services/symbol-list.service';
import { AuthenticationService } from '../../services/authenticate.service';

const DEFAULT_FILTER_POPULAR_LENGTH = 40;

@Component({
	selector: 'app-instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})

export class InstrumentListComponent implements OnInit, OnDestroy {

	@ViewChild('list') listRef: ElementRef;

	constructor(
		private _userService: UserService,
		public cacheService: CacheService,
		public symbolListService: SymbolListService,
		private _changeDetectorRef: ChangeDetectorRef
	) {
		this._changeDetectorRef.detach();
	}

	ngOnInit() {
		
	}

	public build(symbols: Array<SymbolModel>) {
		this.symbolListService.build(symbols);
		if (!this.symbolListService.containerEl.parentNode) {
			this.listRef.nativeElement.appendChild(this.symbolListService.containerEl);
		}	
	}

	public scrollToTop() {
		// this.instrumentList.nativeElement.scrollTop = 0;
	}

	ngOnDestroy() {
		if (this.symbolListService.containerEl.parentNode) {
			this.symbolListService.containerEl.parentNode.removeChild(this.symbolListService.containerEl);
		}
	}
}