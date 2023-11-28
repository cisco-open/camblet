import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
export interface FixAllData {
    type: 'fixAll';
    uri: string;
    fileName: string;
    fixIds: {}[];
}
export interface RefactorData {
    type: 'refactor';
    uri: string;
    fileName: string;
    refactorName: string;
    actionName: string;
    range: {
        pos: number;
        end: number;
    };
}
export interface OrganizeImportsData {
    type: 'organizeImports';
    uri: string;
    fileName: string;
}
export type Data = FixAllData | RefactorData | OrganizeImportsData;
export declare function register(ctx: SharedContext): (uri: string, range: vscode.Range, context: vscode.CodeActionContext) => Promise<vscode.CodeAction[] | undefined>;
//# sourceMappingURL=codeAction.d.ts.map