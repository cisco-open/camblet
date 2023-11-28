import * as path from 'typesafe-path/posix';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { FileSystem } from '@volar/language-service';
export declare const defaultCompilerOptions: ts.CompilerOptions;
export declare function asPosix(path: string): path.PosixPath;
export declare const uriToFileName: (uri: string) => string;
export declare const fileNameToUri: (fileName: string) => string;
export declare function getConfiguration(settings: any, section: string): any;
export declare const fs: FileSystem;
//# sourceMappingURL=utils.d.ts.map