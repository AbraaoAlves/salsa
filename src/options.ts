import * as ts from 'typescript';

interface Options extends ts.CompilerOptions {
  // Produce an error like a wrong typescript file.
  jsTypecheck?: boolean;
}

export default Options;
