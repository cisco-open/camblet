import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (item: vscode.CompletionItem, token?: vscode.CancellationToken) => Promise<vscode.CompletionItem>;
//# sourceMappingURL=completeResolve.d.ts.map