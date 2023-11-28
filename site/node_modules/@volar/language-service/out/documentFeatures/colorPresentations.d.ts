import type { ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, color: vscode.Color, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.ColorPresentation[] | undefined>;
//# sourceMappingURL=colorPresentations.d.ts.map