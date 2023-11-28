import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): {
    doPrepare: (uri: string, position: vscode.Position) => vscode.CallHierarchyItem[];
    getIncomingCalls: (item: vscode.CallHierarchyItem) => vscode.CallHierarchyIncomingCall[];
    getOutgoingCalls: (item: vscode.CallHierarchyItem) => vscode.CallHierarchyOutgoingCall[];
};
//# sourceMappingURL=callHierarchy.d.ts.map