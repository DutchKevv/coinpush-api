import { Injectable, EventEmitter, NgZone } from '@angular/core';
import { SymbolModel } from '../models/symbol.model';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { AuthService } from './auth/auth.service';
import { CacheService } from './cache.service';
import { EventService } from './event.service';
import { EventModel } from '../models/event.model';
import { AccountService } from './account/account.service';

@Injectable({
	providedIn: 'root',
})
export class SymbolListService {

    public activeSymbol: SymbolModel;
    public activeSymbol$: BehaviorSubject<SymbolModel> = new BehaviorSubject(null);
    public alarmButtonClicked$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public containerEl: any = null;
    public isBuild = false;

    private _priceChangeSub;
    private _eventsChangeSub;
    
    private _noSymbolsHTML = '<h3 style="margin-top: 20px; text-align:center">No symbols, system is probably updating</h3>';
    private _noSymbolsEl = (new DOMParser()).parseFromString(this._noSymbolsHTML, "text/xml").firstChild;

    constructor(
        private _zone: NgZone,
        private _cacheService: CacheService,
        private _authenticationService: AuthService,
        private _eventService: EventService,
        private _accountService: AccountService,
        private _userService: UserService
    ) {
        this.init();
    }

    public init() {
        // create container
        this.containerEl = document.createElement('ul');
        this.containerEl.className = 'instrument-list';

        // add header
        this.containerEl.innerHTML = _rowHeaderHTML;

        // add onClick
        this.containerEl.addEventListener('click', (event: PointerEvent) => this._onClickContainer(event), { passive: true });

        // listen for events (prices, alarms)
        this._priceChangeSub = this._cacheService.changed$.subscribe((changedSymbols: Array<SymbolModel>) => this._onPriceChange(changedSymbols));
        this._eventsChangeSub = this._eventService.events$.subscribe((changedEvents: Array<EventModel>) => this._onEventsChange(changedEvents));
    }

    public scrollToTop(): void {
        this.containerEl.scrollTop = 0;
    }

    /**
     * 
     * @param el 
     * @param symbolModel 
     */
    public scrollIntoView(el?: any, symbolModel?: SymbolModel): void {
		const rect = el.getBoundingClientRect();
		const isInView = (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (el.parentNode.offsetHeight + el.offsetHeight));

		if (!isInView)
			el.parentNode.scrollTop = el.offsetTop - el.offsetHeight;
    }

    /**
     * 
     * @param state 
     * @param symbol 
     * @param rowEl 
     * @param emit 
     */
    public toggleActive(state: boolean, symbol?: SymbolModel, rowEl?: HTMLElement, emit: boolean = false): boolean {
        rowEl = rowEl || this._findRowByModel(symbol);

        // remove 'active' class from previous active row
        if (this.activeSymbol) {
            const activeRow = this._findRowByModel(this.activeSymbol);
            activeRow && activeRow.classList.remove('active');
        }

        // add 'active' class to given row
        if (rowEl) {
            state = typeof state === 'boolean' ? state : this.activeSymbol !== rowEl['data'].symbol;

            if (state) {
                rowEl.classList.add('active')
                requestAnimationFrame(() => setTimeout(() => this.scrollIntoView(rowEl), 0));
            }
        }

        // no row found, so force state to false
        else {
            state = false;
        }

        this.activeSymbol = state ? rowEl['data'].symbol : null;

        if (emit) {
            requestAnimationFrame(() => this.activeSymbol$.next(this.activeSymbol));
        }
        
        return state;
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     * @param sendToServer 
     */
    public toggleFavorite(symbolModel?: SymbolModel, rowEl?: HTMLElement, sendToServer: boolean = false): Promise<boolean> {
		if (sendToServer && !this._accountService.isLoggedIn) {
			this._authenticationService.showLoginRegisterPopup();
            return Promise.resolve(false);
		}

        (rowEl || this._findRowByModel(symbolModel)).children[0].classList.toggle('active-icon', !symbolModel.options.iFavorite);

        if (sendToServer)
            return this._cacheService.toggleFavoriteSymbol(symbolModel);
        else
            return Promise.resolve(symbolModel.options.iFavorite);
        }

    /**
     * 
     * @param symbols 
     * @param forceRebuild 
     */
    public build(symbolModels: Array<SymbolModel>, forceRebuild: boolean = false): void {
        // use cached list
        if (this.isBuild && !forceRebuild) return;

        // delete all current rows
        this._clear();

        // show no symbols (system error / updating / starting)
        if (!symbolModels || !symbolModels.length) {
            // this.containerEl.appendChild(this._noSymbolsEl);
            return;
        }

        // get events
        const events = this._eventService.events$.getValue();
        
        symbolModels.forEach((symbolModel: SymbolModel) => {
            if (!symbolModel)
                return;

            const rowEl: HTMLElement = <HTMLElement>_rowEl.cloneNode(true);
            rowEl['data'] = {
                symbol: symbolModel
            };

            // static values
            rowEl.children[1].className += ' symbol-img-' + symbolModel.options.name; // img
            rowEl.children[2].children[0]['innerText'] = symbolModel.options.displayName; // name

            // favorite state
            if (symbolModel.options.iFavorite) {
                rowEl.children[0].className += ' active-icon';
            }

            // alarm state
            if (events.some(event => event.symbol === symbolModel.options.name)) {
                rowEl.children[4].className += ' active-icon';
            }
           
            // current prices
            this._updatePrice(symbolModel, rowEl);

            // add to container
            this.containerEl.appendChild(rowEl);
        });

        this.isBuild = true;

        // scroll back to top after re-build
        this.scrollToTop();
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     */
    private _updatePrice(symbol: SymbolModel, rowEl?: HTMLElement) {      
        // price
        rowEl.children[2].children[1]['innerText'] = symbol.options.bid;

        // changed 1 hour diff
        rowEl.children[3].children[0].children[0]['innerText'] = symbol.options.changedHAmount.toFixed(2) + '%';
        rowEl.children[3].children[0].children[0]['style'].color = symbol.options.changedHAmount > 0 ? COLOR_GREEN : COLOR_RED;

        // changed 24 hour diff
        rowEl.children[3].children[0].children[1]['innerText'] = symbol.options.changedDAmount.toFixed(2) + '%';
        rowEl.children[3].children[0].children[1]['style'].color = symbol.options.changedDAmount > 0 ? COLOR_GREEN : COLOR_RED;

        // high / low
        rowEl.children[3].children[1]['innerText'] = symbol.options.highD + ' | ' + symbol.options.lowD;
    }

    /**
     * toggle alarm icon
     * @param events 
     */
    private _onEventsChange(events: Array<EventModel>): void {
        for (let i = 1, len = this.containerEl.children.length; i < len; i++) {
            const rowEl = this.containerEl.children[i];
            rowEl.children[4].classList.toggle('active-icon', rowEl.data.symbol.options.iAlarm);
        }
    }

    /**
     * 
     * @param event 
     */
    private _onClickContainer(event: PointerEvent): void {
         // get row element
         let rowEl = <HTMLElement>event.target;

        // check if user clicked empty (container) space
        if (!rowEl || rowEl === event.currentTarget) return;

        while (!rowEl['data']) rowEl = <HTMLElement>rowEl.parentNode;

        // favorite
        if ((<HTMLElement>event.target).classList.contains('fa-star'))
            this.toggleFavorite(rowEl['data'].symbol, rowEl, true);

        // alarm
        else if ((<HTMLElement>event.target).classList.contains('fa-bell')) {
            this.toggleActive(true, rowEl['data'].symbol, rowEl, true);
            this.alarmButtonClicked$.next(true);
        }

        // row
        else
            this.toggleActive(undefined, rowEl['data'].symbol, rowEl, true);
    }

    /**
     * 
     * @param symbolNames 
     */
    private _onPriceChange(symbolModels: Array<SymbolModel>): void {
        this._zone.runOutsideAngular(() => {
            for (let i = 0, len = symbolModels.length; i < len; ++i) {
                const rowEl = this._findRowByModel(symbolModels[i]);
    
                if (rowEl)
                    this._updatePrice(rowEl['data'].symbol, rowEl);
            }
        });
    }

    /**
     * 
     * @param symbol 
     */
    private _findRowByModel(symbol: SymbolModel): HTMLElement {
        for (let i = 1, len = this.containerEl.children.length; i < len; ++i)
            if (this.containerEl.children[i].data.symbol === symbol)
                return this.containerEl.children[i];
        }

    /**
     * 
     * @param name 
     */
    private _findRowByName(name: string): HTMLElement {
        for (let i = 1, len = this.containerEl.children.length; i < len; i++) {
            if (this.containerEl.children[i].data.symbol.options.name === name)
                return this.containerEl.children[i];
        }
    }
    
    private _clear(): void {
        while (this.containerEl.children.length > 1)
            this.containerEl.removeChild(this.containerEl.children[1]);
    }

    ngOnDestroy() {
        if (this._priceChangeSub)
            this._priceChangeSub.unsubscribe();
            
        if (this._eventsChangeSub) {
            this._priceChangeSub.unsubscribe();
        }
    }
}

/**
 * settings
 */
const COLOR_RED = '#f92929';
const COLOR_GREEN = '#38cc38';

/**
 * row 
 */
const _rowHTML = `
    <i class="fa fa-star"></i>
    <span class="symbol-img"></span>
    <div class="col-instrument">
        <p class="instrument-title">dd</p>
        <span></span>
    </div>
    <div class="col-changes">
        <div>
            <span></span>
            <span></span>
        </div>
        <div></div>
    </div>
    <i class="fa fa-bell"></i>
`;
const _rowEl = document.createElement('li');
_rowEl.innerHTML = _rowHTML;

const _rowHeaderHTML = `
<li class="instrument-list-header">
    <h4>Instrument Price</h4>
    <h4 class="col-changes">1h / 24h</h4>
</li>`

function number_format(number, decimals, dec_point, thousands_sep) {
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        toFixedFix = function (n, prec) {
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            var k = Math.pow(10, prec);
            return Math.round(n * k) / k;
        },
        s = (prec ? toFixedFix(n, prec) : Math.round(n)).toString().split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}