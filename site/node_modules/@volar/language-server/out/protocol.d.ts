import * as vscode from 'vscode-languageserver-protocol';
import type { VirtualFile, FileRangeCapabilities } from '@volar/language-core';
import type { Mapping, Stack } from '@volar/source-map';
import type { FileStat, FileType } from '@volar/language-service';
/**
 * Server request client
 */
export declare namespace FsReadFileRequest {
    const type: vscode.RequestType<string, string | null | undefined, unknown>;
}
export declare namespace FsReadDirectoryRequest {
    const type: vscode.RequestType<string, [string, FileType][], unknown>;
}
export declare namespace FsStatRequest {
    const type: vscode.RequestType<string, FileStat, unknown>;
}
/**
 * Client request server
 */
export declare namespace FindFileReferenceRequest {
    type ParamsType = {
        textDocument: vscode.TextDocumentIdentifier;
    };
    type ResponseType = vscode.Location[] | null | undefined;
    type ErrorType = never;
    const type: vscode.RequestType<ParamsType, ResponseType, never>;
}
export declare namespace GetMatchTsConfigRequest {
    type ParamsType = vscode.TextDocumentIdentifier;
    type ResponseType = {
        uri: string;
    } | null | undefined;
    type ErrorType = never;
    const type: vscode.RequestType<vscode.TextDocumentIdentifier, ResponseType, never>;
}
export declare namespace AutoInsertRequest {
    type ParamsType = vscode.TextDocumentPositionParams & {
        options: {
            lastChange: {
                range: vscode.Range;
                rangeOffset: number;
                rangeLength: number;
                text: string;
            };
        };
    };
    type ResponseType = string | vscode.TextEdit | null | undefined;
    type ErrorType = never;
    const type: vscode.RequestType<ParamsType, ResponseType, never>;
}
export declare namespace LoadedTSFilesMetaRequest {
    const type: vscode.RequestType0<unknown, unknown>;
}
export declare namespace WriteVirtualFilesNotification {
    const type: vscode.NotificationType<vscode.TextDocumentIdentifier>;
}
export declare namespace ReloadProjectNotification {
    const type: vscode.NotificationType<vscode.TextDocumentIdentifier>;
}
export declare namespace GetVirtualFilesRequest {
    type ParamsType = vscode.TextDocumentIdentifier;
    type ResponseType = VirtualFile | null | undefined;
    type ErrorType = never;
    const type: vscode.RequestType<vscode.TextDocumentIdentifier, ResponseType, never>;
}
export declare namespace GetVirtualFileRequest {
    type ParamsType = {
        sourceFileUri: string;
        virtualFileName: string;
    };
    type ResponseType = {
        content: string;
        mappings: Record<string, Mapping<FileRangeCapabilities>[]>;
        codegenStacks: Stack[];
    };
    type ErrorType = never;
    const type: vscode.RequestType<ParamsType, ResponseType, never>;
}
//# sourceMappingURL=protocol.d.ts.map