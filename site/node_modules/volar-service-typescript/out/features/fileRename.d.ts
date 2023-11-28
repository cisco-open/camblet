import type * as vscode from 'vscode-languageserver-protocol';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): (oldUri: string, newUri: string) => Promise<vscode.WorkspaceEdit | undefined>;
//# sourceMappingURL=fileRename.d.ts.map