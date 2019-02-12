import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';

@Injectable({
    providedIn: 'root'
})
export class AdsService {

    constructor(
        private _configService: ConfigService
    ) {}

    public init(): void {
        // app
        if (this._configService.platform.isApp) {

        } 
        
        // browser
        else {
            this._initAdWords();
        }
    }

    private _initAdWords(): void {
         // google adsense for browser
         const script = document.createElement('script');
         script.async = true;
         script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
         document.head.appendChild(script);

         // (adsbygoogle = window.adsbygoogle || []).push({
         //     google_ad_client: "ca-pub-1181429338292864",
         //     enable_page_level_ads: true,
         //     google_adtest: 'on'
         // });
    }
}
