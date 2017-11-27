import { JSEditorComponent } from "./jseditor.component";
import { Routes, RouterModule } from "@angular/router";

const JSEditor_Router: Routes = [
    {
        path: '',
        component: JSEditorComponent
    }
]

export const JSEditorRouter = RouterModule.forChild(JSEditor_Router);