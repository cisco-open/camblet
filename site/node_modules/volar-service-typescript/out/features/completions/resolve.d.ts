import { SharedContext } from '../../types';
import type * as vscode from '@volar/language-service';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export declare function register(ctx: SharedContext): (item: vscode.CompletionItem, newPosition?: vscode.Position) => Promise<vscode.CompletionItem>;
export declare function getLineText(document: TextDocument, line: number): string;
//# sourceMappingURL=resolve.d.ts.map