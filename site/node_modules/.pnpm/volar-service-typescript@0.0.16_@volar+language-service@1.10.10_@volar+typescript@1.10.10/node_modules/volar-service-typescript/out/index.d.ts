import type { Service } from '@volar/language-service';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { TextDocument } from 'vscode-languageserver-textdocument';
export * from '@volar/typescript';
export interface Provide {
    'typescript/typescript': () => typeof import('typescript/lib/tsserverlibrary');
    'typescript/sys': () => ts.System;
    'typescript/sourceFile': (document: TextDocument) => ts.SourceFile | undefined;
    'typescript/textDocument': (uri: string) => TextDocument | undefined;
    'typescript/languageService': (document?: TextDocument) => ts.LanguageService;
    'typescript/languageServiceHost': (document?: TextDocument) => ts.LanguageServiceHost;
    'typescript/syntacticLanguageService': () => ts.LanguageService;
    'typescript/syntacticLanguageServiceHost': () => ts.LanguageServiceHost;
}
export declare function create(): Service<Provide>;
export default create;
//# sourceMappingURL=index.d.ts.map