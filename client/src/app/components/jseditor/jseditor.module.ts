import {NgModule} from '@angular/core';
import { JSEditorComponent } from './jseditor.component';
import { FileTreeComponent } from '../file-tree/file-tree.component';
import { JSEditorRouter } from './jseditor.route';
import { TypescriptCompilerService } from '../../services/typescript.compiler.service';
import { WebworkerService } from '../../services/code.runner.service';

@NgModule({
    declarations: [
        JSEditorComponent,
        FileTreeComponent
    ],
    imports: [
        JSEditorRouter
    ],
    providers: [
        TypescriptCompilerService,
		WebworkerService,
        // {provide: TypescriptCompilerService, useClass: TypescriptCompilerService},
        // {provide: WebworkerService, useClass: WebworkerService}
    ]
})

export class JSEditorModule {}