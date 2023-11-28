import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export interface ServiceCompletionData {
    uri: string;
    original: Pick<vscode.CompletionItem, 'additionalTextEdits' | 'textEdit' | 'data'>;
    serviceId: string;
    virtualDocumentUri: string | undefined;
}
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, completionContext?: vscode.CompletionContext, token?: vscode.CancellationToken) => Promise<vscode.CompletionList>;
//# sourceMappingURL=complete.d.ts.map