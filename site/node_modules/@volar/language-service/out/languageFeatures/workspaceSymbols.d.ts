import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (query: string, token?: vscode.CancellationToken) => Promise<vscode.WorkspaceSymbol[]>;
//# sourceMappingURL=workspaceSymbols.d.ts.map