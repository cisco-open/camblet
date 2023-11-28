import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, token?: vscode.CancellationToken) => Promise<NonNullable<vscode.Range | {
    range: vscode.Range;
    placeholder: string;
} | {
    message: string;
} | null | undefined> | undefined>;
//# sourceMappingURL=renamePrepare.d.ts.map