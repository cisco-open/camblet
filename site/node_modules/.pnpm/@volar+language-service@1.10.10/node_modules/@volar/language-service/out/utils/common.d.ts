import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function getOverlapRange(range1Start: number, range1End: number, range2Start: number, range2End: number): {
    start: number;
    end: number;
} | undefined;
export declare function isInsideRange(parent: vscode.Range, child: vscode.Range): boolean;
export declare function stringToSnapshot(str: string): ts.IScriptSnapshot;
export declare function resolveCommonLanguageId(uri: string): string;
export declare function sleep(ms: number): Promise<unknown>;
export declare function notEmpty<T>(value: T | null | undefined): value is T;
//# sourceMappingURL=common.d.ts.map