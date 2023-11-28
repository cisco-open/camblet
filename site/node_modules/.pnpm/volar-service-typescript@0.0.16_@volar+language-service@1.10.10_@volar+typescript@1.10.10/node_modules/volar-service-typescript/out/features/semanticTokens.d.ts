import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): (uri: string, range: vscode.Range, legend: vscode.SemanticTokensLegend) => [number, number, number, number, number][] | undefined;
//# sourceMappingURL=semanticTokens.d.ts.map