import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export interface PluginCallHierarchyData {
    uri: string;
    original: Pick<vscode.CallHierarchyItem, 'data'>;
    serviceId: string;
    virtualDocumentUri: string | undefined;
}
export declare function register(context: ServiceContext): {
    doPrepare(uri: string, position: vscode.Position, token?: vscode.CancellationToken): Promise<vscode.CallHierarchyItem[] | undefined>;
    getIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]>;
    getOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[]>;
};
//# sourceMappingURL=callHierarchy.d.ts.map