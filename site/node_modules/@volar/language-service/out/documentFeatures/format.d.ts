import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, options: vscode.FormattingOptions, range: vscode.Range | undefined, onTypeParams: {
    ch: string;
    position: vscode.Position;
} | undefined, token?: vscode.CancellationToken) => Promise<vscode.TextEdit[] | undefined>;
//# sourceMappingURL=format.d.ts.map