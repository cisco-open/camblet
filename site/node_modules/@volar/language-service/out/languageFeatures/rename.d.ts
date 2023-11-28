import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
import { DocumentsAndSourceMaps } from '../documents';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, newName: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceEdit | undefined>;
export declare function mergeWorkspaceEdits(original: vscode.WorkspaceEdit, ...others: vscode.WorkspaceEdit[]): void;
export declare function embeddedEditToSourceEdit(tsResult: vscode.WorkspaceEdit, documents: DocumentsAndSourceMaps, mode: 'fileName' | 'rename' | 'codeAction' | 'format', versions?: Record<string, number>): vscode.WorkspaceEdit | undefined;
//# sourceMappingURL=rename.d.ts.map