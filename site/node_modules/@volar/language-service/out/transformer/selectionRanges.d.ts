import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.SelectionRange>(locations: T[], getOtherRange: (range: vscode.Range) => vscode.Range | undefined): T[];
//# sourceMappingURL=selectionRanges.d.ts.map