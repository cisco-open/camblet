import type { TypeScriptLanguageHost } from '@volar/language-service';
import type * as ts from 'typescript/lib/tsserverlibrary';
export declare function createInferredProject(rootPath: string, getScriptFileNames: () => string[], compilerOptions?: ts.CompilerOptions): {
    languageHost: TypeScriptLanguageHost;
    fileUpdated(fileName: string): void;
    fileDeleted(fileName: string): void;
    fileCreated(fileName: string): void;
    reload(): void;
};
export declare function createProject(sourceTsconfigPath: string, extraFileExtensions?: ts.FileExtensionInfo[], existingOptions?: ts.CompilerOptions): {
    languageHost: TypeScriptLanguageHost;
    fileUpdated(fileName: string): void;
    fileDeleted(fileName: string): void;
    fileCreated(fileName: string): void;
    reload(): void;
};
//# sourceMappingURL=createProject.d.ts.map