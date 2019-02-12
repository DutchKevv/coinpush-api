import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule, MatIconModule } from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NotificationMenuComponent } from './notification-menu.component';
import { RouterModule } from '@angular/router';
import { NormalizeImageUrlPipeModule } from '../../pipes/normalize-image.pipe.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NormalizeImageUrlPipeModule
  ],
  entryComponents: [],
  declarations: [NotificationMenuComponent],
  exports: [NotificationMenuComponent],
})
export class NotificationMenuComponentModule { }
