import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.CompletionItem>(item: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined, document: vscode.TextDocument): T;
//# sourceMappingURL=completionItem.d.ts.map