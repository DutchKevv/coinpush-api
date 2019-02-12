import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent, IModalOptions } from '../../components/modal/modal.component';

@Injectable({
    providedIn: 'root'
})
export class ModalService {

    static readonly TYPE_CONFIRM: number = 1;
    static readonly TYPE_COMPONENT: number = 2;

    static readonly DEFAULTS: IModalOptions = {
        width: '500px',
        closeButton: true,
        autoFocus: true,
        type: ModalService.TYPE_COMPONENT,
        data: {}
    };

    constructor(private _dialog: MatDialog) { }

    public open(options: IModalOptions): MatDialogRef<ModalComponent> {
        options = Object.assign({}, ModalService.DEFAULTS, options);

        const dialog = this._dialog.open(ModalComponent, {
            autoFocus: options.autoFocus,
            width: options.width,
            data: options
        });

        return dialog;
    }
}
