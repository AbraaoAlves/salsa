import { main } from './main';
import {check} from './tsc';
import * as minimist from 'minimist';
import * as ts from 'typescript';

const args = process.argv.slice(2);
let {options, fileNames, errors} = (ts as any).parseCommandLine(args);

check(errors);

const project = options.project || '.';
const {basePath} = minimist(args);

main(project, {basePath}, options)
    .then((exitCode: any) => process.exit(exitCode))
    .catch((e: any) => {
      console.error(e.stack);
      console.error('Compilation failed');
      process.exit(1);
    });