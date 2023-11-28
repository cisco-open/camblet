import type * as vscode from 'vscode-languageserver-protocol';
import type { ServiceContext } from '../types';
export declare function register(context: ServiceContext): (uri: string, position: vscode.Position, signatureHelpContext?: vscode.SignatureHelpContext, token?: vscode.CancellationToken) => Promise<vscode.SignatureHelp | undefined>;
//# sourceMappingURL=signatureHelp.d.ts.map