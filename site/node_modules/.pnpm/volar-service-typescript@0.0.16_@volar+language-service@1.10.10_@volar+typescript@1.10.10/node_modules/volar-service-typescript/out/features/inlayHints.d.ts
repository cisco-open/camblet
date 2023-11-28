import { SharedContext } from '../types';
import type * as vscode from '@volar/language-service';
export declare function register(ctx: SharedContext): (uri: string, range: vscode.Range) => Promise<vscode.InlayHint[] | undefined>;
//# sourceMappingURL=inlayHints.d.ts.map