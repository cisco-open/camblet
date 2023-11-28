import { VirtualFiles, VirtualFile, FileRangeCapabilities, MirrorBehaviorCapabilities, MirrorMap, TypeScriptLanguageHost } from '@volar/language-core';
import { Mapping, SourceMap } from '@volar/source-map';
import type * as vscode from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { ServiceEnvironment } from './types';
export type DocumentsAndSourceMaps = ReturnType<typeof createDocumentsAndSourceMaps>;
export declare class SourceMapWithDocuments<Data = any> {
    sourceFileDocument: TextDocument;
    virtualFileDocument: TextDocument;
    map: SourceMap<Data>;
    constructor(sourceFileDocument: TextDocument, virtualFileDocument: TextDocument, map: SourceMap<Data>);
    toSourceRange(range: vscode.Range, filter?: (data: Data) => boolean): vscode.Range | undefined;
    toGeneratedRange(range: vscode.Range, filter?: (data: Data) => boolean): vscode.Range | undefined;
    toSourceRanges(range: vscode.Range, filter?: (data: Data) => boolean): Generator<vscode.Range, void, unknown>;
    toGeneratedRanges(range: vscode.Range, filter?: (data: Data) => boolean): Generator<vscode.Range, void, unknown>;
    protected toRanges(range: vscode.Range, filter: (data: Data) => boolean, api: 'toSourcePositionsBase' | 'toGeneratedPositionsBase', api2: 'matchSourcePosition' | 'matchGeneratedPosition'): Generator<vscode.Range, void, unknown>;
    toSourcePosition(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): import("vscode-languageserver-textdocument").Position | undefined;
    toGeneratedPosition(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): import("vscode-languageserver-textdocument").Position | undefined;
    toSourcePositions(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): Generator<import("vscode-languageserver-textdocument").Position, void, unknown>;
    toGeneratedPositions(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): Generator<import("vscode-languageserver-textdocument").Position, void, unknown>;
    toSourcePositionsBase(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): Generator<readonly [import("vscode-languageserver-textdocument").Position, Mapping<Data>], void, unknown>;
    toGeneratedPositionsBase(position: vscode.Position, filter?: (data: Data) => boolean, baseOffset?: 'left' | 'right'): Generator<readonly [import("vscode-languageserver-textdocument").Position, Mapping<Data>], void, unknown>;
    protected toPositions(position: vscode.Position, filter: (data: Data) => boolean, fromDoc: TextDocument, toDoc: TextDocument, from: 'sourceRange' | 'generatedRange', to: 'sourceRange' | 'generatedRange', baseOffset: 'left' | 'right'): Generator<readonly [import("vscode-languageserver-textdocument").Position, Mapping<Data>], void, unknown>;
    protected matchSourcePosition(position: vscode.Position, mapping: Mapping, baseOffset: 'left' | 'right'): import("vscode-languageserver-textdocument").Position | undefined;
    protected matchGeneratedPosition(position: vscode.Position, mapping: Mapping, baseOffset: 'left' | 'right'): import("vscode-languageserver-textdocument").Position | undefined;
}
export declare class MirrorMapWithDocument extends SourceMapWithDocuments<[MirrorBehaviorCapabilities, MirrorBehaviorCapabilities]> {
    document: TextDocument;
    constructor(document: TextDocument, map: MirrorMap);
    findMirrorPositions(start: vscode.Position): Generator<readonly [import("vscode-languageserver-textdocument").Position, MirrorBehaviorCapabilities], void, unknown>;
}
export declare function createDocumentsAndSourceMaps(env: ServiceEnvironment, host: TypeScriptLanguageHost, mapper: VirtualFiles): {
    getSourceByUri(sourceFileUri: string): import("@volar/language-core").Source | undefined;
    isVirtualFileUri(virtualFileUri: string): boolean;
    getVirtualFileByUri(virtualFileUri: string): readonly [VirtualFile, import("@volar/language-core").Source] | readonly [undefined, undefined];
    getMirrorMapByUri(virtualFileUri: string): readonly [VirtualFile, MirrorMapWithDocument] | undefined;
    getMapsBySourceFileUri(uri: string): {
        snapshot: ts.IScriptSnapshot;
        maps: [VirtualFile, SourceMapWithDocuments<FileRangeCapabilities>][];
    } | undefined;
    getMapsBySourceFileName(fileName: string): {
        snapshot: ts.IScriptSnapshot;
        maps: [VirtualFile, SourceMapWithDocuments<FileRangeCapabilities>][];
    } | undefined;
    getMapsByVirtualFileUri(virtualFileUri: string): IterableIterator<[VirtualFile, SourceMapWithDocuments<FileRangeCapabilities>]>;
    getMapsByVirtualFileName(virtualFileName: string): IterableIterator<[VirtualFile, SourceMapWithDocuments<FileRangeCapabilities>]>;
    getDocumentByUri(snapshot: ts.IScriptSnapshot, uri: string): TextDocument;
    getDocumentByFileName: (snapshot: ts.IScriptSnapshot, fileName: string) => TextDocument;
};
//# sourceMappingURL=documents.d.ts.map