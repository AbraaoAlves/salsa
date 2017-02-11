import { VinylFile, isVinylFile } from './vinyl_file';
import {existsSync} from 'fs';
import * as ts from 'typescript';
import * as path from 'path';

const DEBUG = false;

function debug(msg: string, ...o: any[]) {
  // tslint:disable-next-line:no-console
  if (DEBUG) console.log(msg, ...o);
}

export class UserError extends Error {
  private _nativeError: Error;

  constructor(message: string) {
    super(message);
    // Required for TS 2.1, see
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, UserError.prototype);

    const nativeError = new Error(message) as any as Error;
    this._nativeError = nativeError;
  }

  get message() { return this._nativeError.message; }
  set message(message) {
    if (this._nativeError) this._nativeError.message = message;
  }
  get name() { return this._nativeError.name; }
  set name(name) {
    if (this._nativeError) this._nativeError.name = name;
  }
  get stack() { return (this._nativeError as any).stack; }
  set stack(value) {
    if (this._nativeError) (this._nativeError as any).stack = value;
  }
  toString() { return this._nativeError.toString(); }
}

export function formatDiagnostics(diags: ts.Diagnostic[]): string {
  return diags
      .map((d) => {
        let res = ts.DiagnosticCategory[d.category];
        if (d.file) {
          res += ' at ' + d.file.fileName + ':';
          const {line, character} = d.file.getLineAndCharacterOfPosition(d.start);
          res += (line + 1) + ':' + (character + 1) + ':';
        }
        res += ' ' + ts.flattenDiagnosticMessageText(d.messageText, '\n');
        return res;
      })
      .join('\n');
}

export function check(diags: ts.Diagnostic[]) {
  if (diags && diags.length && diags[0]) {
    throw new UserError(formatDiagnostics(diags));
  }
}

export interface CompilerInterface {
  readConfiguration(
      project: string|VinylFile, basePath: string, existingOptions?: ts.CompilerOptions):
      ts.ParsedCommandLine;
  typeCheck(compilerHost: ts.CompilerHost, program: ts.Program): void;
  emit(program: ts.Program): number;
}


export class Tsc implements CompilerInterface {
  public parsed: ts.ParsedCommandLine;
  private basePath: string;

  constructor(private readFile = ts.sys.readFile, private readDirectory = ts.sys.readDirectory) {}

  readConfiguration(project: string|VinylFile, basePath: string, existingOptions?: ts.CompilerOptions) {
    
    this.basePath = basePath;

    // Allow a directory containing tsconfig.json as the project value
    // Note, TS@next returns an empty array, while earlier versions throw
    try {
      if (!isVinylFile(project) && this.readDirectory(project).length > 0) {
        project = path.join(project, 'tsconfig.json');
      }
    } catch (e) {
      // Was not a directory, continue on assuming it's a file
    }

    let {config, error} = (() => {
      // project is vinyl like file object
      if (isVinylFile(project)) {
        return {config: JSON.parse(project.contents.toString()), error: null};
      }
      // project is path to project file
      else {
        return ts.readConfigFile(project, this.readFile);
      }
    })();
    
    check([error]);

    // Do not inline `host` into `parseJsonConfigFileContent` until after
    // g3 is updated to the latest TypeScript.
    // The issue is that old typescript only has `readDirectory` while
    // the newer TypeScript has additional `useCaseSensitiveFileNames` and
    // `fileExists`. Inlining will trigger an error of extra parameters.
    const host = {
      useCaseSensitiveFileNames: true,
      fileExists: existsSync,
      readDirectory: this.readDirectory,
      readFile: ts.sys.readFile
    };
    
    this.parsed = ts.parseJsonConfigFileContent(config, host, basePath, existingOptions);

    check(this.parsed.errors);
    
    this.parsed.fileNames.forEach((file, i, list) =>{
      if(/\.js/.test(file)){
        list[i] = file.replace('.js', '!.ts'); 
      }  
    });

    return this.parsed;
  }

  typeCheck(compilerHost: ts.CompilerHost, program: ts.Program): void {
    debug('Checking global diagnostics...');
    check(program.getGlobalDiagnostics());

    const diagnostics: ts.Diagnostic[] = [];
    debug('Type checking...');

    for (const sf of program.getSourceFiles()) {
      diagnostics.push(...ts.getPreEmitDiagnostics(program, sf));
    }
    check(diagnostics);
  }

  emit(program: ts.Program): number {
    debug('Emitting outputs...');
    const emitResult = program.emit();
    const diagnostics: ts.Diagnostic[] = [];
    diagnostics.push(...emitResult.diagnostics);
    return emitResult.emitSkipped ? 1 : 0;
  }
}

export const tsc: CompilerInterface = new Tsc();