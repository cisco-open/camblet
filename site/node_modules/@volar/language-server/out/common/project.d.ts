import { TypeScriptLanguageHost } from '@volar/language-service';
import type * as ts from 'typescript/lib/tsserverlibrary';
import * as vscode from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { WorkspacesContext } from './workspaces';
export interface ProjectContext extends WorkspacesContext {
    project: {
        workspaceUri: URI;
        rootUri: URI;
        tsConfig: string | ts.CompilerOptions;
    };
}
export type Project = ReturnType<typeof createProject>;
export declare function createProject(context: ProjectContext): Promise<{
    context: ProjectContext;
    tsConfig: string | ts.CompilerOptions;
    languageHost: TypeScriptLanguageHost;
    getLanguageService: () => {
        getTriggerCharacters: () => string[];
        getAutoFormatTriggerCharacters: () => string[];
        getSignatureHelpTriggerCharacters: () => string[];
        getSignatureHelpRetriggerCharacters: () => string[];
        format: (uri: string, options: vscode.FormattingOptions, range: vscode.Range | undefined, onTypeParams: {
            ch: string;
            position: vscode.Position;
        } | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.TextEdit[] | undefined>;
        getFoldingRanges: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.FoldingRange[] | undefined>;
        getSelectionRanges: (uri: string, positions: vscode.Position[], token?: vscode.CancellationToken | undefined) => Promise<vscode.SelectionRange[] | undefined>;
        findLinkedEditingRanges: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LinkedEditingRanges | undefined>;
        findDocumentSymbols: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentSymbol[] | undefined>;
        findDocumentColors: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.ColorInformation[] | undefined>;
        getColorPresentations: (uri: string, color: vscode.Color, range: vscode.Range, token?: vscode.CancellationToken | undefined) => Promise<vscode.ColorPresentation[] | undefined>;
        doValidation: (uri: string, mode: "all" | "semantic" | "syntactic", token?: vscode.CancellationToken | undefined, response?: ((result: vscode.Diagnostic[]) => void) | undefined) => Promise<vscode.Diagnostic[]>;
        findReferences: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.Location[] | undefined>;
        findFileReferences: (uri: string, token?: vscode.CancellationToken | undefined) => import("@volar/language-service").NullableResult<vscode.Location[]>;
        findDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        findTypeDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        findImplementations: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        prepareRename: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<NonNullable<vscode.Range | {
            range: vscode.Range;
            placeholder: string;
        } | {
            message: string;
        } | null | undefined> | undefined>;
        doRename: (uri: string, position: vscode.Position, newName: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceEdit | undefined>;
        getEditsForFileRename: (oldUri: string, newUri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceEdit | undefined>;
        getSemanticTokens: (uri: string, range: vscode.Range | undefined, legend: vscode.SemanticTokensLegend, token?: vscode.CancellationToken | undefined, reportProgress?: ((tokens: vscode.SemanticTokens) => void) | undefined) => Promise<vscode.SemanticTokens | undefined>;
        doHover: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.Hover | undefined>;
        doComplete: (uri: string, position: vscode.Position, completionContext?: vscode.CompletionContext | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.CompletionList>;
        doCodeActions: (uri: string, range: vscode.Range, codeActionContext: vscode.CodeActionContext, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeAction[] | undefined>;
        doCodeActionResolve: (item: vscode.CodeAction, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeAction>;
        doCompletionResolve: (item: vscode.CompletionItem, token?: vscode.CancellationToken | undefined) => Promise<vscode.CompletionItem>;
        getSignatureHelp: (uri: string, position: vscode.Position, signatureHelpContext?: vscode.SignatureHelpContext | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.SignatureHelp | undefined>;
        doCodeLens: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeLens[]>;
        doCodeLensResolve: (item: vscode.CodeLens, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeLens>;
        findDocumentHighlights: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentHighlight[] | undefined>;
        findDocumentLinks: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentLink[]>;
        doDocumentLinkResolve: (item: vscode.DocumentLink, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentLink>;
        findWorkspaceSymbols: (query: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceSymbol[]>;
        doAutoInsert: (uri: string, position: vscode.Position, autoInsertContext: import("@volar/language-service").AutoInsertionContext, token?: vscode.CancellationToken | undefined) => Promise<NonNullable<string | vscode.TextEdit | null | undefined> | undefined>;
        getInlayHints: (uri: string, range: vscode.Range, token?: vscode.CancellationToken | undefined) => Promise<vscode.InlayHint[] | undefined>;
        doInlayHintResolve: (item: vscode.InlayHint, token?: vscode.CancellationToken | undefined) => Promise<vscode.InlayHint>;
        callHierarchy: {
            doPrepare(uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined): Promise<vscode.CallHierarchyItem[] | undefined>;
            getIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]>;
            getOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]>;
        };
        dispose: () => void;
        context: import("@volar/language-service").ServiceContext<any>;
    };
    getLanguageServiceDontCreate: () => {
        getTriggerCharacters: () => string[];
        getAutoFormatTriggerCharacters: () => string[];
        getSignatureHelpTriggerCharacters: () => string[];
        getSignatureHelpRetriggerCharacters: () => string[];
        format: (uri: string, options: vscode.FormattingOptions, range: vscode.Range | undefined, onTypeParams: {
            ch: string;
            position: vscode.Position;
        } | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.TextEdit[] | undefined>;
        getFoldingRanges: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.FoldingRange[] | undefined>;
        getSelectionRanges: (uri: string, positions: vscode.Position[], token?: vscode.CancellationToken | undefined) => Promise<vscode.SelectionRange[] | undefined>;
        findLinkedEditingRanges: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LinkedEditingRanges | undefined>;
        findDocumentSymbols: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentSymbol[] | undefined>;
        findDocumentColors: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.ColorInformation[] | undefined>;
        getColorPresentations: (uri: string, color: vscode.Color, range: vscode.Range, token?: vscode.CancellationToken | undefined) => Promise<vscode.ColorPresentation[] | undefined>;
        doValidation: (uri: string, mode: "all" | "semantic" | "syntactic", token?: vscode.CancellationToken | undefined, response?: ((result: vscode.Diagnostic[]) => void) | undefined) => Promise<vscode.Diagnostic[]>;
        findReferences: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.Location[] | undefined>;
        findFileReferences: (uri: string, token?: vscode.CancellationToken | undefined) => import("@volar/language-service").NullableResult<vscode.Location[]>;
        findDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        findTypeDefinition: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        findImplementations: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.LocationLink[] | undefined>;
        prepareRename: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<NonNullable<vscode.Range | {
            range: vscode.Range;
            placeholder: string;
        } | {
            message: string;
        } | null | undefined> | undefined>;
        doRename: (uri: string, position: vscode.Position, newName: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceEdit | undefined>;
        getEditsForFileRename: (oldUri: string, newUri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceEdit | undefined>;
        getSemanticTokens: (uri: string, range: vscode.Range | undefined, legend: vscode.SemanticTokensLegend, token?: vscode.CancellationToken | undefined, reportProgress?: ((tokens: vscode.SemanticTokens) => void) | undefined) => Promise<vscode.SemanticTokens | undefined>;
        doHover: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.Hover | undefined>;
        doComplete: (uri: string, position: vscode.Position, completionContext?: vscode.CompletionContext | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.CompletionList>;
        doCodeActions: (uri: string, range: vscode.Range, codeActionContext: vscode.CodeActionContext, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeAction[] | undefined>;
        doCodeActionResolve: (item: vscode.CodeAction, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeAction>;
        doCompletionResolve: (item: vscode.CompletionItem, token?: vscode.CancellationToken | undefined) => Promise<vscode.CompletionItem>;
        getSignatureHelp: (uri: string, position: vscode.Position, signatureHelpContext?: vscode.SignatureHelpContext | undefined, token?: vscode.CancellationToken | undefined) => Promise<vscode.SignatureHelp | undefined>;
        doCodeLens: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeLens[]>;
        doCodeLensResolve: (item: vscode.CodeLens, token?: vscode.CancellationToken | undefined) => Promise<vscode.CodeLens>;
        findDocumentHighlights: (uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentHighlight[] | undefined>;
        findDocumentLinks: (uri: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentLink[]>;
        doDocumentLinkResolve: (item: vscode.DocumentLink, token?: vscode.CancellationToken | undefined) => Promise<vscode.DocumentLink>;
        findWorkspaceSymbols: (query: string, token?: vscode.CancellationToken | undefined) => Promise<vscode.WorkspaceSymbol[]>;
        doAutoInsert: (uri: string, position: vscode.Position, autoInsertContext: import("@volar/language-service").AutoInsertionContext, token?: vscode.CancellationToken | undefined) => Promise<NonNullable<string | vscode.TextEdit | null | undefined> | undefined>;
        getInlayHints: (uri: string, range: vscode.Range, token?: vscode.CancellationToken | undefined) => Promise<vscode.InlayHint[] | undefined>;
        doInlayHintResolve: (item: vscode.InlayHint, token?: vscode.CancellationToken | undefined) => Promise<vscode.InlayHint>;
        callHierarchy: {
            doPrepare(uri: string, position: vscode.Position, token?: vscode.CancellationToken | undefined): Promise<vscode.CallHierarchyItem[] | undefined>;
            getIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]>;
            getOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]>;
        };
        dispose: () => void;
        context: import("@volar/language-service").ServiceContext<any>;
    } | undefined;
    getParsedCommandLine: () => ts.ParsedCommandLine;
    tryAddFile: (fileName: string) => void;
    askedFiles: {
        clear: () => void;
        values: () => IterableIterator<boolean>;
        uriKeys: () => IterableIterator<string>;
        uriDelete: (_uri: string) => boolean;
        uriGet: (_uri: string) => boolean | undefined;
        uriHas: (_uri: string) => boolean;
        uriSet: (_uri: string, item: boolean) => void;
        pathDelete: (path: string) => boolean;
        pathGet: (path: string) => boolean | undefined;
        pathHas: (path: string) => boolean | undefined;
        pathSet: (path: string, item: boolean) => void;
    };
    dispose: () => void;
}>;
//# sourceMappingURL=project.d.ts.map