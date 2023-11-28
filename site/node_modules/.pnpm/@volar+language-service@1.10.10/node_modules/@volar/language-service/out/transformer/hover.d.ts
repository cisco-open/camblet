import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends vscode.Hover>(hover: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined): T | undefined;
//# sourceMappingURL=hover.d.ts.map