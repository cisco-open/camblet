import { SharedContext } from '../types';
import type * as ts from 'typescript/lib/tsserverlibrary';
import type * as Proto from '../protocol';
export interface IFilePathToResourceConverter {
    /**
     * Convert a typescript filepath to a VS Code resource.
     */
    toResource(filepath: string): string;
}
export declare function plainWithLinks(parts: readonly Proto.SymbolDisplayPart[] | string, filePathConverter: IFilePathToResourceConverter, ctx: SharedContext): string;
export declare function tagsMarkdownPreview(tags: readonly ts.JSDocTagInfo[], filePathConverter: IFilePathToResourceConverter, ctx: SharedContext): string;
export declare function markdownDocumentation(documentation: Proto.SymbolDisplayPart[] | string | undefined, tags: ts.JSDocTagInfo[] | undefined, filePathConverter: IFilePathToResourceConverter, ctx: SharedContext): string;
export declare function addMarkdownDocumentation(out: string, documentation: Proto.SymbolDisplayPart[] | string | undefined, tags: ts.JSDocTagInfo[] | undefined, converter: IFilePathToResourceConverter, ctx: SharedContext): string;
//# sourceMappingURL=previewer.d.ts.map