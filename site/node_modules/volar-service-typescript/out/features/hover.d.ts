import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
export declare function register(ctx: SharedContext): (uri: string, position: vscode.Position, documentOnly?: boolean) => vscode.Hover | undefined;
//# sourceMappingURL=hover.d.ts.map