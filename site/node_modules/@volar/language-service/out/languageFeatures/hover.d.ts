import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<vscode.Hover | undefined>;
//# sourceMappingURL=hover.d.ts.map