import { DocumentsAndSourceMaps, SourceMapWithDocuments } from '../documents';
import { FileRangeCapabilities, VirtualFile } from '@volar/language-core';
export declare function visitEmbedded(documents: DocumentsAndSourceMaps, current: VirtualFile, cb: (file: VirtualFile, sourceMap: SourceMapWithDocuments<FileRangeCapabilities>) => Promise<boolean>, rootFile?: VirtualFile): Promise<boolean>;
//# sourceMappingURL=definePlugin.d.ts.map