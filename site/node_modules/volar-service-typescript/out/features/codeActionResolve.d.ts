import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as vscode from '@volar/language-service';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { SharedContext } from '../types';
import { Data, FixAllData, RefactorData } from './codeAction';
export declare function register(ctx: SharedContext): (codeAction: vscode.CodeAction) => Promise<vscode.CodeAction>;
export declare function resolveFixAllCodeAction(ctx: SharedContext, codeAction: vscode.CodeAction, data: FixAllData, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences): void;
export declare function resolveRefactorCodeAction(ctx: SharedContext, codeAction: vscode.CodeAction, data: RefactorData, document: TextDocument, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences): void;
export declare function resolveOrganizeImportsCodeAction(ctx: SharedContext, codeAction: vscode.CodeAction, data: Data, formatOptions: ts.FormatCodeSettings, preferences: ts.UserPreferences): void;
//# sourceMappingURL=codeActionResolve.d.ts.map