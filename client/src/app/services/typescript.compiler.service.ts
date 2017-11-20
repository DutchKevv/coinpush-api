import {transpileModule, ModuleKind} from 'typescript';
import { Injectable } from '@angular/core';

@Injectable()
export class TypescriptCompilerService {
    constructor() {}

    public compile(files: Array<string>): Array<any> {
        const results = files.map(file => {
            let result = transpileModule(file, { compilerOptions: { module: ModuleKind.CommonJS } });
        
            console.log(result);
            return result;
        });
        
        return results;
    }
}