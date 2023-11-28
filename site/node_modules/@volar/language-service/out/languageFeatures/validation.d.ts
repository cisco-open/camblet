import type * as vscode from 'vscode-languageserver-protocol';
import { ServiceContext } from '../types';
export declare function updateRange(range: vscode.Range, change: {
    range: vscode.Range;
    newEnd: vscode.Position;
}): vscode.Range | undefined;
export interface ServiceDiagnosticData {
    uri: string;
    version: number;
    original: Pick<vscode.Diagnostic, 'data'>;
    type: 'service' | 'rule';
    isFormat: boolean;
    serviceOrRuleId: string;
    ruleFixIndex: number;
    documentUri: string;
}
export declare const errorMarkups: Record<string, {
    error: vscode.Diagnostic;
    markup: vscode.MarkupContent;
}[]>;
export declare function register(context: ServiceContext): (uri: string, mode: 'all' | 'semantic' | 'syntactic', token?: vscode.CancellationToken, response?: ((result: vscode.Diagnostic[]) => void) | undefined) => Promise<vscode.Diagnostic[]>;
//# sourceMappingURL=validation.d.ts.map