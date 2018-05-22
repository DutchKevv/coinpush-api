import { Injectable, EventEmitter } from '@angular/core';
import { SymbolModel } from '../models/symbol.model';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { AuthenticationService } from './authenticate.service';

@Injectable({
	providedIn: 'root',
})
export class SymbolListService {

    public activeSymbol$: BehaviorSubject<SymbolModel> = new BehaviorSubject(null);
    public alarmButtonClicked$: EventEmitter<boolean> = new EventEmitter(null);

    public containerEl: any = document.createElement('div');

    public isBuild = false;

    constructor(
        private _authenticationService: AuthenticationService,
        private _userService: UserService
    ) {}

    /**
     * 
     * @param event 
     */
    onClick(event) {
        event.preventDefault();

        // favorite button
        if (event.target.classList.contains('fa-star')) {
            this.toggleFavorite(event.currentTarget.data.symbol, event.currentTarget, true);
        }

        // alarm button
        else if (event.target.classList.contains('fa-bell')) {
            this.alarmButtonClicked$.next(true);
        }

        // row clicked
        else {
            const state = this.toggleActive(undefined, undefined, event.currentTarget);
            this.activeSymbol$.next(state ? event.currentTarget.data.symbol : null);
        }
    }

    /**
     * 
     * @param state 
     * @param symbol 
     * @param rowEl 
     */
    public toggleActive(state: boolean, symbol?: SymbolModel, rowEl?): boolean {
        rowEl = (rowEl || this._findRowByModel(symbol));

        // remove [active] class from all rows
        for (let i = 0, len = this.containerEl.children.length; i < len; i++)
            if (rowEl !== this.containerEl.children[i])
                this.containerEl.children[i].className = '';

        
        // set [active] on selected row        
        rowEl.classList.toggle('active', typeof state === 'boolean' ? state : !rowEl.classList.contains('active'));

        return rowEl.classList.contains('active');
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     * @param sendToServer 
     */
    public async toggleFavorite(symbol?: SymbolModel, rowEl?, sendToServer: boolean = false) {
		if (sendToServer && !this._userService.model.options._id) {
			this._authenticationService.showLoginRegisterPopup();
			return;
		}

        (rowEl || this._findRowByModel(symbol)).children[0].classList.toggle('active-icon', !symbol.options.iFavorite);

        if (sendToServer) {
            return this._userService.toggleFavoriteSymbol(symbol);
        }
	}

    /**
     * 
     * @param symbols 
     */
    public build(symbols: Array<SymbolModel>, forceRebuild = false) {
        if (this.isBuild && !forceRebuild)
            return;

        this._clearContainer();
        
        symbols.forEach(symbol => {
            const rowEl: any = <HTMLElement>_rowEl.cloneNode(true);
            rowEl.data = {
                symbol
            };

            rowEl.onclick = this.onClick.bind(this);

            // static values
            rowEl.children[1].children[0].className += ' symbol-img-' + symbol.options.name; // img
            rowEl.children[1].children[1].innerText = symbol.options.name; // name

            // favorite
            if (symbol.options.iFavorite) {
                rowEl.children[0].className += ' active-icon';
            }
           
            this.updatePrice(symbol, rowEl);

            this.containerEl.appendChild(rowEl);
        });

        this.isBuild = true;

        return this.containerEl;
    }

    /**
     * 
     * @param symbol 
     * @param rowEl 
     */
    public updatePrice(symbol: SymbolModel, rowEl?) {
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

    private _clearContainer() {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
    }

    private _findRowByModel(symbol: SymbolModel) {
        for (let i = 0, len = this.containerEl.children.length; i < len; i++) {
            if (this.containerEl.children[i].data.symbol === symbol)
                return this.containerEl.children[i];
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