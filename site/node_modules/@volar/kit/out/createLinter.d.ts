import { Config, Diagnostic, TypeScriptLanguageHost } from '@volar/language-service';
export declare function createLinter(config: Config, host: TypeScriptLanguageHost): {
    check: (fileName: string) => Promise<Diagnostic[]>;
    fixErrors: (fileName: string, diagnostics: Diagnostic[], only: string[] | undefined, writeFile: (fileName: string, newText: string) => Promise<void>) => Promise<void>;
    printErrors: (fileName: string, diagnostics: Diagnostic[], rootPath?: string) => string;
    logErrors: (fileName: string, diagnostics: Diagnostic[], rootPath?: string) => void;
    settings: any;
};
//# sourceMappingURL=createLinter.d.ts.map