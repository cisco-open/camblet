import { SharedContext } from '../../types';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as vscode from '@volar/language-service';
export interface Data {
    uri: string;
    fileName: string;
    offset: number;
    originalItem: {
        name: ts.CompletionEntry['name'];
        source: ts.CompletionEntry['source'];
        data: ts.CompletionEntry['data'];
        labelDetails: ts.CompletionEntry['labelDetails'];
    };
}
export declare function register(ctx: SharedContext): (uri: string, position: vscode.Position, options?: ts.GetCompletionsAtPositionOptions | undefined) => Promise<vscode.CompletionList | undefined>;
export declare function handleKindModifiers(item: vscode.CompletionItem, tsEntry: ts.CompletionEntry | ts.CompletionEntryDetails): void;
//# sourceMappingURL=basic.d.ts.map