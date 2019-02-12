import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatFormFieldModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule, MatIconModule } from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NotificationMenuComponentModule } from '../notification-menu/notification-menu.component.module';
import { RouterModule } from '@angular/router';
import { NormalizeImageUrlPipeModule } from '../../pipes/normalize-image.pipe.module';
import { NavigationMenuComponent } from './navigation-menu.component';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule,
    NormalizeImageUrlPipeModule
  ],
  entryComponents: [],
  declarations: [NavigationMenuComponent],
  exports: [NavigationMenuComponent],
})
export class NavigationMenuComponentModule { }
