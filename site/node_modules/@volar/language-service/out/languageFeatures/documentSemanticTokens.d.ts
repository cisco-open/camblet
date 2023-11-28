import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, range: vscode.Range | undefined, legend: vscode.SemanticTokensLegend, token?: vscode.CancellationToken, reportProgress?: ((tokens: vscode.SemanticTokens) => void) | undefined) => Promise<vscode.SemanticTokens | undefined>;
//# sourceMappingURL=documentSemanticTokens.d.ts.map