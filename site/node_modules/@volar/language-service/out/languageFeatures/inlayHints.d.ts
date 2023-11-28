import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export interface InlayHintData {
    uri: string;
    original: Pick<vscode.CodeAction, 'data' | 'edit'>;
    serviceId: string;
}
export declare function register(context: ServiceContext): (uri: string, range: vscode.Range, token?: vscode.CancellationToken) => Promise<vscode.InlayHint[] | undefined>;
//# sourceMappingURL=inlayHints.d.ts.map