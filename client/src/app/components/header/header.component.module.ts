import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule, MatIconModule } from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from './header.component';
import { NotificationMenuComponentModule } from '../notification-menu/notification-menu.component.module';
import { RouterModule } from '@angular/router';
import { NormalizeImageUrlPipeModule } from '../../pipes/normalize-image.pipe.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    NotificationMenuComponentModule,
    RouterModule,
    NormalizeImageUrlPipeModule
  ],
  entryComponents: [],
  declarations: [HeaderComponent],
  exports: [HeaderComponent],
})
export class HeaderComponentModule { }
