import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export interface DocumentLinkData {
    uri: string;
    original: Pick<vscode.DocumentLink, 'data'>;
    serviceId: string;
}
export declare function register(context: ServiceContext): (uri: string, token?: vscode.CancellationToken) => Promise<vscode.DocumentLink[]>;
//# sourceMappingURL=documentLinks.d.ts.map