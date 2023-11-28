import type { Service } from '@volar/language-service';
import * as html from 'vscode-html-languageservice';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export interface Provide {
    'html/htmlDocument': (document: TextDocument) => html.HTMLDocument | undefined;
    'html/languageService': () => html.LanguageService;
    'html/documentContext': () => html.DocumentContext;
    'html/updateCustomData': (extraData: html.IHTMLDataProvider[]) => void;
}
export declare function getHtmlDocument(document: TextDocument): html.HTMLDocument;
export declare function create({ languageId, useDefaultDataProvider, useCustomDataProviders, }?: {
    languageId?: string;
    useDefaultDataProvider?: boolean;
    useCustomDataProviders?: boolean;
}): Service<Provide>;
export default create;
//# sourceMappingURL=index.d.ts.map