import { Component, Inject, ViewChild, ComponentRef, Input, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IModalOptions } from '../../modal.component';

export interface IConfirmModalOptions {
  text?: string;
}

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {

  @Input('data') data: IConfirmModalOptions = {};
  @ViewChild('modalFooter') public modalFooterRef: ElementRef;
    
  public modalOptions = {
    width: '400px'
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public options: IModalOptions,
    private _dialogRef: MatDialogRef<ComponentRef<any>>
  ) { }

  public confirm(): void {
    this._dialogRef.close(true);
  }
}
