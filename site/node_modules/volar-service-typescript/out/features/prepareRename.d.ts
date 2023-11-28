import { SharedContext } from '../types';
import type * as vscode from '@volar/language-service';
export declare const renameInfoOptions: {
    allowRenameOfImportPath: boolean;
};
export declare function register(ctx: SharedContext): (uri: string, position: vscode.Position) => vscode.Range | {
    message: string;
} | undefined;
//# sourceMappingURL=prepareRename.d.ts.map