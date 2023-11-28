import type { ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export interface ServiceCodeLensData {
    kind: 'normal';
    uri: string;
    original: Pick<vscode.CodeLens, 'data'>;
    serviceId: string;
}
export interface ServiceReferencesCodeLensData {
    kind: 'references';
    uri: string;
    range: vscode.Range;
    serviceId: string;
}
export declare function register(context: ServiceContext): (uri: string, token?: vscode.CancellationToken) => Promise<vscode.CodeLens[]>;
//# sourceMappingURL=codeLens.d.ts.map