import type { ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, positions: vscode.Position[], token?: vscode.CancellationToken) => Promise<vscode.SelectionRange[] | undefined>;
//# sourceMappingURL=selectionRanges.d.ts.map