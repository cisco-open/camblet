import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.SelectionRange>(location: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined): T | undefined;
//# sourceMappingURL=selectionRange.d.ts.map