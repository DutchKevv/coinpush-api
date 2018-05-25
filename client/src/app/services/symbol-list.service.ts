import { Injectable, EventEmitter, NgZone } from '@angular/core';
import { SymbolModel } from '../models/symbol.model';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { AuthenticationService } from './authenticate.service';
import { CacheService } from './cache.service';
import { EventService } from './event.service';
import { EventModel } from '../models/event.model';

@Injectable({
	providedIn: 'root',
})
export class SymbolListService {

    public activeSymbol: SymbolModel;
    public activeSymbol$: BehaviorSubject<SymbolModel> = new BehaviorSubject(null);
    public alarmButtonClicked$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public containerEl: any = document.createElement('div');;
    public isBuild = false;

    private _priceChangeSub;
    private _eventsChangeSub;

    constructor(
        private _zone: NgZone,
        private _cacheService: CacheService,
        private _authenticationService: AuthenticationService,
        private _eventService: EventService,
        private _userService: UserService
    ) {
        this._priceChangeSub = this._cacheService.changed$.subscribe(changedSymbols => this._onPriceChange(changedSymbols));
        this._eventsChangeSub = this._eventService.events$.subscribe(changedSymbols => this._onEventsChange(changedSymbols));
    }

    public scrollToTop(): void {
        this.containerEl.scrollTop = 0;
    }

    /**
     * 
     * @param el 
     */
    public scrollIntoView(el?: any, symbolModel?: SymbolModel): void {
		if (!el && !symbolModel) {
			return console.warn('no element or symbolModel given');
		}

		const rect = el.getBoundingClientRect();
		const isInView = (rect.top >= 0 && rect.left >= 0 && rect.bottom <= (el.parentNode.parentNode.offsetHeight + el.offsetHeight));

		if (!isInView) {
			el.parentNode.parentNode.scrollTop = el.offsetTop - el.offsetHeight;
		}
	}

    /**
     * 
     * @param state 
     * @param symbol 
     * @param rowEl 
     * @param emit 
     */
    public toggleActive(state: boolean, symbol?: SymbolModel, rowEl?, emit: boolean = false): boolean {
        rowEl = (rowEl || this._findRowByModel(symbol));

        // remove [active] class from all rows
        for (let i = 0, len = this.containerEl.children.length; i < len; i++)
            if (rowEl !== this.containerEl.children[i])
                this.containerEl.children[i].className = '';

        
        // set [active] on selected row    
        if (rowEl) {
            state = typeof state === 'boolean' ? state : !rowEl.classList.contains('active');    
            rowEl.classList.toggle('active', state);

            if (state) {
                requestAnimationFrame(() => {
                    setTimeout(() => this.scrollIntoView(rowEl), 0);
                });
            }
        } else {
            state = false;
        }

        this.activeSymbol = state && rowEl ? rowEl.data.symbol : null;

        if (emit) {
            this.activeSymbol$.next(this.activeSymbol);
        }
        
        return state;
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     * @param sendToServer 
     */
    public toggleFavorite(symbol?: SymbolModel, rowEl?, sendToServer: boolean = false): Promise<boolean> {
		if (sendToServer && !this._userService.model.options._id) {
			this._authenticationService.showLoginRegisterPopup();
			return;
		}

        (rowEl || this._findRowByModel(symbol)).children[0].classList.toggle('active-icon', !symbol.options.iFavorite);

        if (sendToServer) {
            return this._cacheService.toggleFavoriteSymbol(symbol);
        }
	}

    /**
     * 
     * @param symbols 
     */
    public build(symbols: Array<SymbolModel>, forceRebuild = false): void {
        if (this.isBuild && !forceRebuild)
            return;

        this._clearContainer();

        const events = this._eventService.events$.getValue();
        
        symbols.forEach(symbol => {
            const rowEl: any = <HTMLElement>_rowEl.cloneNode(true);
            rowEl.data = {
                symbol
            };

            rowEl.onclick = this._onClick.bind(this);

            // static values
            rowEl.children[1].children[0].className += ' symbol-img-' + symbol.options.name; // img
            rowEl.children[1].children[1].innerText = symbol.options.name; // name

            // favorite
            if (symbol.options.iFavorite) {
                rowEl.children[0].className += ' active-icon';
            }

            // alarm
            if (events.some(event => event.symbol === symbol.options.name)) {
                rowEl.children[3].className += ' active-icon';
            }
           
            this._updatePrice(symbol, rowEl);

            this.containerEl.appendChild(rowEl);
        });

        this.isBuild = true;

        this.scrollToTop();
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     */
    private _updatePrice(symbol: SymbolModel, rowEl?) {
        rowEl = rowEl || this._findRowByModel(symbol);

        // change only on price change
        if (rowEl.data.lastPrice === symbol.options.bid) {
            return;
        }

        // store new last price
        rowEl.data.lastPrice = symbol.options.bid;

        // price
        rowEl.children[1].children[2].innerText = symbol.options.bid;

        // changed hour diff
        rowEl.children[2].children[0].children[0].innerText = symbol.options.changedHAmount + '%';
        rowEl.children[2].children[0].children[0].style.color = symbol.options.changedHAmount > 0 ? COLOR_GREEN : COLOR_RED;

        // changed day diff
        rowEl.children[2].children[0].children[1].innerText = symbol.options.changedDAmount + '%';
        rowEl.children[2].children[0].children[1].style.color = symbol.options.changedDAmount > 0 ? COLOR_GREEN : COLOR_RED;

        // high / low
        rowEl.children[2].children[1].children[0].innerText = symbol.options.highD + ' | ' + symbol.options.lowD;
    }

    /**
     * 
     * @param events 
     */
    private _onEventsChange(events: Array<EventModel>): void {
        for (let i = 0, len = this.containerEl.children.length; i < len; i++) {
            const rowEl = this.containerEl.children[i];
            rowEl.children[3].classList.toggle('active-icon', rowEl.data.symbol.options.iAlarm);
        }
    }

    /**
     * 
     * @param event 
     */
    private _onClick(event): void {
        event.preventDefault();

        // favorite button
        if (event.target.classList.contains('fa-star')) {
            this.toggleFavorite(event.currentTarget.data.symbol, event.currentTarget, true);
        }

        // alarm button
        else if (event.target.classList.contains('fa-bell')) {
            this.toggleActive(true, undefined, event.currentTarget, true);
            this.alarmButtonClicked$.next(true);
        }

        // row clicked
        else {
            this.toggleActive(undefined, undefined, event.currentTarget, true);
        }
    }

    /**
     * 
     * @param symbolNames 
     */
    private _onPriceChange(symbolNames: Array<string>): void {
        this._zone.runOutsideAngular(() => {
            for (let i = 0, len = symbolNames.length; i < len; i++) {
                const symbolName = symbolNames[i];
                const symbolRow = this._findRowByName(symbolName);
    
                if (symbolRow) {
                    this._updatePrice(symbolRow.data.symbol, symbolRow);
                } 
            }
        });
    }

    /**
     * 
     * @param symbol 
     */
    private _findRowByModel(symbol: SymbolModel): any {
        for (let i = 0, len = this.containerEl.children.length; i < len; i++) {
            if (this.containerEl.children[i].data.symbol === symbol)
                return this.containerEl.children[i];
        }
    }

    /**
     * 
     * @param name 
     */
    private _findRowByName(name: string): any {
        for (let i = 0, len = this.containerEl.children.length; i < len; i++) {
            if (this.containerEl.children[i].data.symbol.options.name === name)
                return this.containerEl.children[i];
        }
    }
    
    private _clearContainer(): void {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
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
    <i class="fa fa-star col-bookmark"></i>
    <div class="col-instrument">
        <span class="instrument-image"></span>
        <p class="instrument-title">dd</p>
        <span>bid</span>
    </div>
    <div class="col-changes">
        <div class="col-1h">
            <span class="changed-amount">
                12
            </span>
            <span class="changed-amount">
                12
            </span>
        </div>
        <div>
            <span class="value-bid">
                <i class="fa fa-exchange"></i>
            </span>
        </div>
    </div>
    <i class="fa fa-bell col-alert"></i>
`;
const _rowEl = document.createElement('a');
_rowEl.innerHTML = _rowHTML;

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