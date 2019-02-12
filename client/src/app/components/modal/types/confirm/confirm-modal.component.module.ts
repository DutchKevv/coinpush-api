import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule, MatButtonModule } from '@angular/material';
import { ConfirmModalComponent } from './confirm-modal.component';

@NgModule({
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule
    ],
    declarations: [ConfirmModalComponent],
    exports: [ConfirmModalComponent],
})
export class ConfirmModalComponentModule { }
