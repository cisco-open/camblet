import type { Service } from '@volar/language-service';
import { type Options, type ResolveConfigOptions } from 'prettier';
export declare function create(options?: {
    /**
     * Languages to be formatted by prettier.
     *
     * @default
     * ['html', 'css', 'scss', 'typescript', 'javascript']
     */
    languages?: string[];
    html?: {
        /**
         * Preprocessing to break "contents" from "HTML tags".
         * This will prevent HTML closing tags, and opening tags without attributes
         * from breaking into a blank `>` or `<` on a new line.
         */
        breakContentsFromTags?: boolean;
    };
    /**
     * Do not use settings from VSCode's `editor.tabSize` and temporary tabSize on status bar
     *
     * @see https://github.com/volarjs/services/issues/5
     */
    ignoreIdeOptions?: boolean;
    /**
     * Determine if IDE options should be used as a fallback if there's no Prettier specific settings in the workspace
     */
    useIdeOptionsFallback?: boolean;
    /**
     * Additional options to pass to Prettier
     * This is useful, for instance, to add specific plugins you need.
     */
    additionalOptions?: (resolvedConfig: Options) => Options | Promise<Options>;
    /**
     * Options to use when resolving the Prettier config
     */
    resolveConfigOptions?: ResolveConfigOptions;
    /**
     * Prettier instance to use. If undefined, Prettier will be imported through a normal `import('prettier')`.
     * This property is useful whenever you want to load a specific instance of Prettier (for instance, loading the Prettier version installed in the user's project)
     */
    prettier?: typeof import('prettier') | undefined;
}, getPrettierConfig?: (filePath: string, prettier: typeof import('prettier'), config?: ResolveConfigOptions) => Promise<Options>): Service;
export default create;
//# sourceMappingURL=index.d.ts.map