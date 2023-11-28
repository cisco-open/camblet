import { TypeScriptLanguageHost } from '@volar/language-core';
import { Config, ServiceContext, ServiceEnvironment, SharedModules } from './types';
import type * as vscode from 'vscode-languageserver-protocol';
export type LanguageService = ReturnType<typeof createLanguageServiceBase>;
export declare function createLanguageService(modules: SharedModules, env: ServiceEnvironment, config: Config, languageHost: TypeScriptLanguageHost): {
    getTriggerCharacters: () => string[];
    getAutoFormatTriggerCharacters: () => string[];
    getSignatureHelpTriggerCharacters: () => string[];
    getSignatureHelpRetriggerCharacters: () => string[];
    format: (uri: string, options: vscode.FormattingOptions, range: vscode.Range | undefined, onTypeParams: {
        ch: string;
        position: vscode.Position;
    } | undefined, token?: vscode.CancellationToken) => Promise<vscode.TextEdit[] | undefined>;
    getFoldingRanges: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.FoldingRange[] | undefined>;
    getSelectionRanges: (uri: string, positions: vscode.Position[], token?: vscode.CancellationToken) => Promise<vscode.SelectionRange[] | undefined>;
    findLinkedEditingRanges: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LinkedEditingRanges | undefined>;
    findDocumentSymbols: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.DocumentSymbol[] | undefined>;
    findDocumentColors: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.ColorInformation[] | undefined>;
    getColorPresentations: (uri: string, color: vscode.Color, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.ColorPresentation[] | undefined>;
    doValidation: (uri: string, mode: "all" | "semantic" | "syntactic", token?: vscode.CancellationToken, response?: ((result: vscode.Diagnostic[]) => void) | undefined) => Promise<vscode.Diagnostic[]>;
    findReferences: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.Location[] | undefined>;
    findFileReferences: (uri: string, token?: vscode.CancellationToken) => import("./types").NullableResult<vscode.Location[]>;
    findDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    findTypeDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    findImplementations: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    prepareRename: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<NonNullable<vscode.Range | {
        range: vscode.Range;
        placeholder: string;
    } | {
        message: string;
    } | null | undefined> | undefined>;
    doRename: (uri: string, position: vscode.Position, newName: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceEdit | undefined>;
    getEditsForFileRename: (oldUri: string, newUri: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceEdit | undefined>;
    getSemanticTokens: (uri: string, range: vscode.Range | undefined, legend: vscode.SemanticTokensLegend, token?: vscode.CancellationToken, reportProgress?: ((tokens: vscode.SemanticTokens) => void) | undefined) => Promise<vscode.SemanticTokens | undefined>;
    doHover: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.Hover | undefined>;
    doComplete: (uri: string, position: vscode.Position, completionContext?: vscode.CompletionContext, token?: vscode.CancellationToken) => Promise<vscode.CompletionList>;
    doCodeActions: (uri: string, range: vscode.Range, codeActionContext: vscode.CodeActionContext, token?: vscode.CancellationToken) => Promise<vscode.CodeAction[] | undefined>;
    doCodeActionResolve: (item: vscode.CodeAction, token?: vscode.CancellationToken) => Promise<vscode.CodeAction>;
    doCompletionResolve: (item: vscode.CompletionItem, token?: vscode.CancellationToken) => Promise<vscode.CompletionItem>;
    getSignatureHelp: (uri: string, position: vscode.Position, signatureHelpContext?: vscode.SignatureHelpContext, token?: vscode.CancellationToken) => Promise<vscode.SignatureHelp | undefined>;
    doCodeLens: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.CodeLens[]>;
    doCodeLensResolve: (item: vscode.CodeLens, token?: vscode.CancellationToken) => Promise<vscode.CodeLens>;
    findDocumentHighlights: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.DocumentHighlight[] | undefined>;
    findDocumentLinks: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink[]>;
    doDocumentLinkResolve: (item: vscode.DocumentLink, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink>;
    findWorkspaceSymbols: (query: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceSymbol[]>;
    doAutoInsert: (uri: string, position: vscode.Position, autoInsertContext: import("./types").AutoInsertionContext, token?: vscode.CancellationToken) => Promise<NonNullable<string | vscode.TextEdit | null | undefined> | undefined>;
    getInlayHints: (uri: string, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.InlayHint[] | undefined>;
    doInlayHintResolve: (item: vscode.InlayHint, token?: vscode.CancellationToken) => Promise<vscode.InlayHint>;
    callHierarchy: {
        doPrepare(uri: string, position: vscode.Position, token?: vscode.CancellationToken): Promise<vscode.CallHierarchyItem[] | undefined>;
        getIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]>;
        getOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]>;
    };
    dispose: () => void;
    context: ServiceContext<any>;
};
declare function createLanguageServiceBase(context: ServiceContext): {
    getTriggerCharacters: () => string[];
    getAutoFormatTriggerCharacters: () => string[];
    getSignatureHelpTriggerCharacters: () => string[];
    getSignatureHelpRetriggerCharacters: () => string[];
    format: (uri: string, options: vscode.FormattingOptions, range: vscode.Range | undefined, onTypeParams: {
        ch: string;
        position: vscode.Position;
    } | undefined, token?: vscode.CancellationToken) => Promise<vscode.TextEdit[] | undefined>;
    getFoldingRanges: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.FoldingRange[] | undefined>;
    getSelectionRanges: (uri: string, positions: vscode.Position[], token?: vscode.CancellationToken) => Promise<vscode.SelectionRange[] | undefined>;
    findLinkedEditingRanges: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LinkedEditingRanges | undefined>;
    findDocumentSymbols: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.DocumentSymbol[] | undefined>;
    findDocumentColors: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.ColorInformation[] | undefined>;
    getColorPresentations: (uri: string, color: vscode.Color, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.ColorPresentation[] | undefined>;
    doValidation: (uri: string, mode: "all" | "semantic" | "syntactic", token?: vscode.CancellationToken, response?: ((result: vscode.Diagnostic[]) => void) | undefined) => Promise<vscode.Diagnostic[]>;
    findReferences: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.Location[] | undefined>;
    findFileReferences: (uri: string, token?: vscode.CancellationToken) => import("./types").NullableResult<vscode.Location[]>;
    findDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    findTypeDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    findImplementations: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LocationLink[] | undefined>;
    prepareRename: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<NonNullable<vscode.Range | {
        range: vscode.Range;
        placeholder: string;
    } | {
        message: string;
    } | null | undefined> | undefined>;
    doRename: (uri: string, position: vscode.Position, newName: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceEdit | undefined>;
    getEditsForFileRename: (oldUri: string, newUri: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceEdit | undefined>;
    getSemanticTokens: (uri: string, range: vscode.Range | undefined, legend: vscode.SemanticTokensLegend, token?: vscode.CancellationToken, reportProgress?: ((tokens: vscode.SemanticTokens) => void) | undefined) => Promise<vscode.SemanticTokens | undefined>;
    doHover: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.Hover | undefined>;
    doComplete: (uri: string, position: vscode.Position, completionContext?: vscode.CompletionContext, token?: vscode.CancellationToken) => Promise<vscode.CompletionList>;
    doCodeActions: (uri: string, range: vscode.Range, codeActionContext: vscode.CodeActionContext, token?: vscode.CancellationToken) => Promise<vscode.CodeAction[] | undefined>;
    doCodeActionResolve: (item: vscode.CodeAction, token?: vscode.CancellationToken) => Promise<vscode.CodeAction>;
    doCompletionResolve: (item: vscode.CompletionItem, token?: vscode.CancellationToken) => Promise<vscode.CompletionItem>;
    getSignatureHelp: (uri: string, position: vscode.Position, signatureHelpContext?: vscode.SignatureHelpContext, token?: vscode.CancellationToken) => Promise<vscode.SignatureHelp | undefined>;
    doCodeLens: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.CodeLens[]>;
    doCodeLensResolve: (item: vscode.CodeLens, token?: vscode.CancellationToken) => Promise<vscode.CodeLens>;
    findDocumentHighlights: (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.DocumentHighlight[] | undefined>;
    findDocumentLinks: (uri: string, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink[]>;
    doDocumentLinkResolve: (item: vscode.DocumentLink, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink>;
    findWorkspaceSymbols: (query: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceSymbol[]>;
    doAutoInsert: (uri: string, position: vscode.Position, autoInsertContext: import("./types").AutoInsertionContext, token?: vscode.CancellationToken) => Promise<NonNullable<string | vscode.TextEdit | null | undefined> | undefined>;
    getInlayHints: (uri: string, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.InlayHint[] | undefined>;
    doInlayHintResolve: (item: vscode.InlayHint, token?: vscode.CancellationToken) => Promise<vscode.InlayHint>;
    callHierarchy: {
        doPrepare(uri: string, position: vscode.Position, token?: vscode.CancellationToken): Promise<vscode.CallHierarchyItem[] | undefined>;
        getIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]>;
        getOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]>;
    };
    dispose: () => void;
    context: ServiceContext<any>;
};
export {};
//# sourceMappingURL=baseLanguageService.d.ts.map