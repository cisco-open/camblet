import type * as ts from 'typescript/lib/tsserverlibrary';
import { SharedContext } from '../types';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export declare function getUserPreferences(ctx: SharedContext, document: TextDocument): Promise<ts.UserPreferences>;
//# sourceMappingURL=getUserPreferences.d.ts.map