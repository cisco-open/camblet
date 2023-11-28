import { SharedContext } from '../types';
import type * as vscode from '@volar/language-service';
export declare function register(ctx: SharedContext): (uri: string, position: vscode.Position, context?: vscode.SignatureHelpContext) => vscode.SignatureHelp | undefined;
//# sourceMappingURL=signatureHelp.d.ts.map