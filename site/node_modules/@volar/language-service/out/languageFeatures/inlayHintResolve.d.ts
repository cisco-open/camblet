import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (item: vscode.InlayHint, token?: vscode.CancellationToken) => Promise<vscode.InlayHint>;
//# sourceMappingURL=inlayHintResolve.d.ts.map