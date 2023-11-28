import { Config, FormattingOptions } from '@volar/language-service';
export declare function createFormatter(config: Config, compilerOptions?: import("typescript/lib/tsserverlibrary").CompilerOptions): {
    formatFile: (fileName: string, options: FormattingOptions) => Promise<string>;
    formatCode: (content: string, languageId: string, options: FormattingOptions) => Promise<string>;
    settings: any;
};
//# sourceMappingURL=createFormatter.d.ts.map