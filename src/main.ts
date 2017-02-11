import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {check, tsc} from './tsc';
import {VinylFile, isVinylFile} from './vinyl_file';

import { createCompilerHost } from './process';

export function main(
  project: string, cliOptions: { basePath: string }, options?: ts.CompilerOptions
): Promise<any> {
  try {
    let projectDir = project;
    // project is vinyl like file object
    if (isVinylFile(project)) {
      projectDir = path.dirname(project.path);
    }
    // project is path to project file
    else if (fs.lstatSync(project).isFile()) {
      projectDir = path.dirname(project);
    }

    // file names in tsconfig are resolved relative to this absolute path
    const basePath = path.resolve(process.cwd(), cliOptions.basePath || projectDir);

    // read the configuration options from wherever you store them
    const parsed = tsc.readConfiguration(project, basePath, options);
    
    //console.log('fileNames', parsed.fileNames);

    const createProgram = (host: ts.CompilerHost, oldProgram?: ts.Program) =>
      ts.createProgram(parsed.fileNames, parsed.options, host, oldProgram);
    
    const diagnostics = (parsed.options as any).diagnostics;
    if (diagnostics) (ts as any).performance.enable();

    //TODO: get custom host for pass to program
    const host = createCompilerHost(parsed.options, true);
    
    // HACK: patch the realpath to solve symlink issue here:
    // https://github.com/Microsoft/TypeScript/issues/9552
    // todo(misko): remove once facade symlinks are removed
    host.realpath = (path) => path;

    const program = createProgram(host);
    const errors = program.getOptionsDiagnostics();
    check(errors);

    //console.log('source files', program.getSourceFiles().map(i => i.fileName));

    tsc.typeCheck(host, program);
    tsc.emit(program);

    if (diagnostics) {
      (ts as any).performance.forEachMeasure(
          (name: string, duration: number) => { console.error(`TS ${name}: ${duration}ms`); });
    }
  } catch (e) {
    return Promise.reject(e);
  }
  return Promise.resolve(0);
};
