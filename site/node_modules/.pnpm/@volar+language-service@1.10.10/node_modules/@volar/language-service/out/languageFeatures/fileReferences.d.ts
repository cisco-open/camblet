import type { NullableResult, ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, token?: vscode.CancellationToken) => NullableResult<vscode.Location[]>;
//# sourceMappingURL=fileReferences.d.ts.map