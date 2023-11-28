import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.CompletionList>(completionList: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined, document: vscode.TextDocument, onItem?: (newItem: vscode.CompletionItem, oldItem: vscode.CompletionItem) => void): T;
//# sourceMappingURL=completionList.d.ts.map