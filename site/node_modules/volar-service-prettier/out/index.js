"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
function create(options = {}, getPrettierConfig = async (filePath, prettier, config) => {
    return await prettier.resolveConfig(filePath, config) ?? {};
}) {
    return (context) => {
        if (!context) {
            return {};
        }
        let prettier;
        try {
            prettier = options.prettier ?? require('prettier');
        }
        catch (e) {
            throw new Error("Could not load Prettier: " + e);
        }
        const languages = options.languages ?? ['html', 'css', 'scss', 'typescript', 'javascript'];
        return {
            async provideDocumentFormattingEdits(document, _, formatOptions) {
                if (!languages.includes(document.languageId)) {
                    return;
                }
                const filePath = context.env.uriToFileName(document.uri);
                const fileInfo = await prettier.getFileInfo(filePath, { ignorePath: '.prettierignore', resolveConfig: false });
                if (fileInfo.ignored) {
                    return;
                }
                const filePrettierOptions = await getPrettierConfig(filePath, prettier, options.resolveConfigOptions);
                const editorPrettierOptions = await context.env.getConfiguration?.('prettier', document.uri);
                const ideFormattingOptions = formatOptions !== undefined && options.useIdeOptionsFallback // We need to check for options existing here because some editors might not have it
                    ? {
                        tabWidth: formatOptions.tabSize,
                        useTabs: !formatOptions.insertSpaces,
                    }
                    : {};
                // Return a config with the following cascade:
                // - Prettier config file should always win if it exists, if it doesn't:
                // - Prettier config from the VS Code extension is used, if it doesn't exist:
                // - Use the editor's basic configuration settings
                const prettierOptions = returnObjectIfHasKeys(filePrettierOptions) || returnObjectIfHasKeys(editorPrettierOptions) || ideFormattingOptions;
                const currentPrettierConfig = {
                    ...(options.additionalOptions
                        ? await options.additionalOptions(prettierOptions)
                        : prettierOptions),
                    filepath: filePath,
                };
                if (!options.ignoreIdeOptions) {
                    currentPrettierConfig.useTabs = !formatOptions.insertSpaces;
                    currentPrettierConfig.tabWidth = formatOptions.tabSize;
                }
                const fullText = document.getText();
                let oldText = fullText;
                const isHTML = document.languageId === "html";
                if (isHTML && options.html?.breakContentsFromTags) {
                    oldText = oldText
                        .replace(/(<[a-z][^>]*>)([^ \n])/gi, "$1 $2")
                        .replace(/([^ \n])(<\/[a-z][a-z0-9\t\n\r -]*>)/gi, "$1 $2");
                }
                return [{
                        newText: await prettier.format(oldText, currentPrettierConfig),
                        range: {
                            start: document.positionAt(0),
                            end: document.positionAt(fullText.length),
                        },
                    }];
            },
        };
    };
}
exports.create = create;
exports.default = create;
function returnObjectIfHasKeys(obj) {
    if (Object.keys(obj || {}).length > 0) {
        return obj;
    }
}
//# sourceMappingURL=index.js.map