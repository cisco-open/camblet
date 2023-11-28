import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (item: vscode.CodeAction, token?: vscode.CancellationToken) => Promise<vscode.CodeAction>;
//# sourceMappingURL=codeActionResolve.d.ts.map