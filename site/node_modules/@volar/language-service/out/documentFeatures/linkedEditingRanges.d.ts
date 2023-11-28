import type { ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.LinkedEditingRanges | undefined>;
//# sourceMappingURL=linkedEditingRanges.d.ts.map