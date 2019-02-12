import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule, MatIconModule } from '@angular/material';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NormalizeImgUrlPipe } from './normalize-image.pipe';

@NgModule({
  imports: [

  ],
  entryComponents: [],
  declarations: [NormalizeImgUrlPipe],
  exports: [NormalizeImgUrlPipe],
  providers: [NormalizeImgUrlPipe]
})
export class NormalizeImageUrlPipeModule { }
