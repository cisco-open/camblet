import type * as vscode from 'vscode-languageserver-protocol';
export declare function transform<T extends {
    range: vscode.Range;
}>(location: T, getOtherRange: (range: vscode.Range) => vscode.Range | undefined): T | undefined;
//# sourceMappingURL=locationLike.d.ts.map