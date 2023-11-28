import { SharedContext } from '../types';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type { FormattingOptions } from '@volar/language-service';
import type { TextDocument } from 'vscode-languageserver-textdocument';
export declare function getFormatCodeSettings(ctx: SharedContext, document: TextDocument, options?: FormattingOptions): Promise<ts.FormatCodeSettings>;
//# sourceMappingURL=getFormatCodeSettings.d.ts.map