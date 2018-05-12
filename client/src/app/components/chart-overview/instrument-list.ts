import { CacheService } from "../../services/cache.service";
import { SymbolModel } from "../../models/symbol.model";

const rowHTML = `<a (click)="setActiveSymbol($event, symbol)">
<i (click)="onClickToggleFavorite($event, symbol);" [ngClass]="{'active-icon': symbol.options.iFavorite}" class="fa fa-star col-bookmark"></i>
<div class="col-instrument">
    <span class="instrument-image symbol-img-{{symbol.options.name}}"></span>
    <p class="instrument-title">dd</p>
    <span>bid</span>
</div>
<div class="col-changes">
    <div class="col-1h">
        <span [ngClass]="{'text-positive': symbol.options.changedHAmount > 0, 'text-negative': symbol.options.changedHAmount < 0}"
            class="changed-amount">
            12
        </span>
        <span [ngClass]="{'text-positive': symbol.options.changedDAmount > 0, 'text-negative': symbol.options.changedDAmount < 0}"
            class="changed-amount">
            12
        </span>
    </div>
    <div *ngIf="!symbol.options.halted;else halted">
        <span class="value-bid">
            <i class="fa fa-exchange"></i>
        </span>
    </div>
    <ng-template #halted>Market closed</ng-template>
</div>
<i (click)="toggleAlarmMenu($event, symbol, true)" class="fa fa-bell col-alert" [ngClass]="{'active-icon': symbol.options.iAlarm}"></i>
</a>`

export class InstrumentList {
    
    private _containerEl = document.createDocumentFragment();
    private _row = document.createRange().createContextualFragment(rowHTML);;


    constructor(private _cacheService: CacheService) {

    }

    build(symbols: Array<SymbolModel>) {
        const containerEl = document.createDocumentFragment();

        symbols.forEach(symbol => {
            const rowContainer = document.createRange().createContextualFragment(`<a (click)="setActiveSymbol($event, symbol)">
            <i (click)="onClickToggleFavorite($event, symbol);" [ngClass]="{'active-icon': symbol.options.iFavorite}" class="fa fa-star col-bookmark"></i>
            <div class="col-instrument">
                <span class="instrument-image symbol-img-${symbol.options.name}"></span>
                <p class="instrument-title">${symbol.options.name}</p>
                <span>${symbol.options.bid}</span>
            </div>
            <div class="col-changes">
                <div class="col-1h">
                    <span [ngClass]="{'text-positive': symbol.options.changedHAmount > 0, 'text-negative': symbol.options.changedHAmount < 0}"
                        class="changed-amount">
                        ${symbol.options.changedHAmount}
                    </span>
                    <span [ngClass]="{'text-positive': symbol.options.changedDAmount > 0, 'text-negative': symbol.options.changedDAmount < 0}"
                        class="changed-amount">
                        ${symbol.options.changedDAmount}
                    </span>
                </div>
                <div *ngIf="!symbol.options.halted;else halted">
                    <span class="value-bid">
                        <i class="fa fa-exchange"></i>
                    </span>
                </div>
                <ng-template #halted>Market closed</ng-template>
            </div>
            <i (click)="toggleAlarmMenu($event, symbol, true)" class="fa fa-bell col-alert" [ngClass]="{'active-icon': symbol.options.iAlarm}"></i>
            </a>`);

            // favorite btn
            const rowObj = {
                el: rowContainer,
                favBtn: rowContainer.querySelector('.fa-bookmark'),
                price: rowContainer.querySelector('.value-bid'),
            }

            containerEl.appendChild(rowContainer);
        });
        
        return containerEl;
    }

    update() {
        
    }
}