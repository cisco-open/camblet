import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.TextEdit | vscode.InsertReplaceEdit>(textEdit: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined, document: vscode.TextDocument): T | undefined;
//# sourceMappingURL=textEdit.d.ts.map