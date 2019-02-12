import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface IAddress {
    cdn: {
        url: string;
    },
    api: {
        prefix: string;
    }
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    public readonly version: string = '0.0.2';

    public platform = {
        adsEnabled: true,
        version: '',
        isEmulator: (window['device'] && window['device'].isVirtual) || navigator.platform === 'Linux i686',
        isApp: document.URL.startsWith('file://'),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window['MSStream'],
        isAndroid: /Android/.test(navigator.userAgent) && !window['MSStream'],
        isTouch: 'ontouchstart' in document.documentElement,
        isSecure: document.URL.startsWith('https://')
    };

    public address: IAddress = {
        api: {
            prefix: '/api/v1/'
        },
        cdn: {
            url: environment.production ? 'https://www.static.coinpush.app/' : 'http://localhost:4100/'
        }
    };

    // public address: any = {
    //     secure: true,
    //     host: devApiProtocol,
    //     ip: devApiIp,
    //     port: devApiPort,
    //     ws: devApiWsType,
    //     hostUrl: '',
    //     apiUrl: '',
    // }
        

    public viewport: any = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    constructor() {}

    public init(): void {
        window.addEventListener('resize', () => {
            // if (window.app) {
            //     window.app.platform.windowW = window.innerWidth;
            //     window.app.platform.windowH = window.innerHeight;
            // }
        }, { passive: true });
    }
}
