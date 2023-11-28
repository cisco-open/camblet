import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (item: vscode.DocumentLink, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink>;
export declare function transformDocumentLinkTarget(target: string, context: ServiceContext): string;
//# sourceMappingURL=documentLinkResolve.d.ts.map