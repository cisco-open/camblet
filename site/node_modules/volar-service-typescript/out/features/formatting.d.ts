import type * as vscode from '@volar/language-service';
import { SharedContext } from '../types';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export declare function register(ctx: SharedContext): {
    onRange: (document: TextDocument, range: vscode.Range | undefined, options: vscode.FormattingOptions) => Promise<vscode.TextEdit[]>;
    onType: (document: TextDocument, options: vscode.FormattingOptions, position: vscode.Position, key: string) => Promise<vscode.TextEdit[]>;
};
//# sourceMappingURL=formatting.d.ts.map