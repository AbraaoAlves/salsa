import * as ts from 'typescript';
import * as path from 'path';
import {translate} from './translate';

export function createCompilerHost(options: ts.CompilerOptions, setParentsNodes?: boolean): ts.CompilerHost {
    let host = ts.createCompilerHost(options, setParentsNodes);
    const olgGetSourceFile = host.getSourceFile;

    host.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile  => {
      if(/!\.ts/.test(fileName)){
        //console.log('opa');
        fileName = fileName.replace('!.ts', '.ts');
        //console.log('readfile', fileName.replace('.ts', '.js'));
        let sourceText = ts.sys.readFile(fileName.replace('.ts', '.js'));

        sourceText = translate(sourceText);

        return ts.createSourceFile(fileName, sourceText, languageVersion);
      }
      
      return olgGetSourceFile(fileName, languageVersion, onError);
    }

    return host; 
}