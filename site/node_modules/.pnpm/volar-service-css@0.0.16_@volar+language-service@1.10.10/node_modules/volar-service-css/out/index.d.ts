import type { Service } from '@volar/language-service';
import * as css from 'vscode-css-languageservice';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export interface Provide {
    'css/stylesheet': (document: TextDocument) => css.Stylesheet | undefined;
    'css/languageService': (languageId: string) => css.LanguageService | undefined;
}
export declare function create(): Service<Provide>;
export default create;
//# sourceMappingURL=index.d.ts.map