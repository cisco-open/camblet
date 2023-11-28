import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export interface ServiceCodeActionData {
    uri: string;
    version: number;
    type: 'service';
    original: Pick<vscode.CodeAction, 'data' | 'edit'>;
    serviceId: string;
}
export interface RuleCodeActionData {
    uri: string;
    version: number;
    documentUri: string;
    type: 'rule';
    isFormat: boolean;
    ruleId: string;
    ruleFixIndex: number;
    index: number;
}
export declare function register(context: ServiceContext): (uri: string, range: vscode.Range, codeActionContext: vscode.CodeActionContext, token?: vscode.CancellationToken) => Promise<vscode.CodeAction[] | undefined>;
//# sourceMappingURL=codeActions.d.ts.map