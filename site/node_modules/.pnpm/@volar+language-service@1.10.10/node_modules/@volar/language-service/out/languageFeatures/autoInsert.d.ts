import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext, AutoInsertionContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, autoInsertContext: AutoInsertionContext, token?: vscode.CancellationToken) => Promise<NonNullable<string | vscode.TextEdit | null | undefined> | undefined>;
//# sourceMappingURL=autoInsert.d.ts.map