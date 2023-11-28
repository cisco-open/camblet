import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): (uri: string, position: vscode.Position, newName: string) => Promise<vscode.WorkspaceEdit | undefined>;
export declare function fileTextChangesToWorkspaceEdit(changes: readonly ts.FileTextChanges[], ctx: SharedContext): vscode.WorkspaceEdit;
//# sourceMappingURL=rename.d.ts.map