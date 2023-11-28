import type { ServiceContext } from '../types';
import type * as vscode from 'vscode-languageserver-protocol';
export declare function register(context: ServiceContext): (uri: string, token?: vscode.CancellationToken) => Promise<vscode.ColorInformation[] | undefined>;
//# sourceMappingURL=documentColors.d.ts.map