"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLineText = exports.register = void 0;
const getFormatCodeSettings_1 = require("../../configs/getFormatCodeSettings");
const getUserPreferences_1 = require("../../configs/getUserPreferences");
const shared_1 = require("../../shared");
const previewer = require("../../utils/previewer");
const snippetForFunctionCall_1 = require("../../utils/snippetForFunctionCall");
const transforms_1 = require("../../utils/transforms");
const basic_1 = require("./basic");
function register(ctx) {
    const { ts } = ctx;
    return async (item, newPosition) => {
        const data = item.data;
        if (!data)
            return item;
        const fileName = data.fileName;
        let offset = data.offset;
        const document = ctx.getTextDocument(data.uri);
        if (newPosition && document) {
            offset = document.offsetAt(newPosition);
        }
        const [formatOptions, preferences] = document ? await Promise.all([
            (0, getFormatCodeSettings_1.getFormatCodeSettings)(ctx, document),
            (0, getUserPreferences_1.getUserPreferences)(ctx, document),
        ]) : [{}, {}];
        let details;
        try {
            details = ctx.typescript.languageService.getCompletionEntryDetails(fileName, offset, data.originalItem.name, formatOptions, data.originalItem.source, preferences, data.originalItem.data);
        }
        catch (err) {
            item.detail = `[TS Error]\n${err}\n${JSON.stringify(err, undefined, 2)}`;
        }
        if (!details)
            return item;
        if (data.originalItem.labelDetails) {
            item.labelDetails ??= {};
            Object.assign(item.labelDetails, data.originalItem.labelDetails);
        }
        const { sourceDisplay } = details;
        if (sourceDisplay) {
            item.labelDetails ??= {};
            item.labelDetails.description = ts.displayPartsToString(sourceDisplay);
        }
        const detailTexts = [];
        if (details.codeActions) {
            if (!item.additionalTextEdits)
                item.additionalTextEdits = [];
            for (const action of details.codeActions) {
                detailTexts.push(action.description);
                for (const changes of action.changes) {
                    const entries = changes.textChanges.map(textChange => {
                        return { fileName, textSpan: textChange.span };
                    });
                    const locs = (0, transforms_1.entriesToLocations)(entries, ctx);
                    locs.forEach((loc, index) => {
                        item.additionalTextEdits?.push({ range: loc.range, newText: changes.textChanges[index].newText });
                    });
                }
            }
        }
        if (details.displayParts) {
            detailTexts.push(previewer.plainWithLinks(details.displayParts, { toResource }, ctx));
        }
        if (detailTexts.length) {
            item.detail = detailTexts.join('\n');
        }
        item.documentation = {
            kind: 'markdown',
            value: previewer.markdownDocumentation(details.documentation, details.tags, { toResource }, ctx),
        };
        if (details) {
            (0, basic_1.handleKindModifiers)(item, details);
        }
        if (document) {
            const useCodeSnippetsOnMethodSuggest = await ctx.env.getConfiguration?.((0, shared_1.getConfigTitle)(document) + '.suggest.completeFunctionCalls') ?? false;
            const useCodeSnippet = useCodeSnippetsOnMethodSuggest && (item.kind === 3 || item.kind === 2);
            if (useCodeSnippet) {
                const shouldCompleteFunction = isValidFunctionCompletionContext(ctx.typescript.languageService, fileName, offset, document);
                if (shouldCompleteFunction) {
                    const { snippet, parameterCount } = (0, snippetForFunctionCall_1.snippetForFunctionCall)({
                        insertText: item.insertText ?? item.textEdit?.newText,
                        label: item.label,
                    }, details.displayParts);
                    if (item.textEdit) {
                        item.textEdit.newText = snippet;
                    }
                    if (item.insertText) {
                        item.insertText = snippet;
                    }
                    item.insertTextFormat = 2;
                    if (parameterCount > 0) {
                        //Fix for https://github.com/microsoft/vscode/issues/104059
                        //Don't show parameter hints if "editor.parameterHints.enabled": false
                        // if (await getConfiguration('editor.parameterHints.enabled', document.uri)) {
                        // 	item.command = {
                        // 		title: 'triggerParameterHints',
                        // 		command: 'editor.action.triggerParameterHints',
                        // 	};
                        // }
                    }
                }
            }
        }
        return item;
        function toResource(path) {
            return ctx.env.fileNameToUri(path);
        }
    };
}
exports.register = register;
function isValidFunctionCompletionContext(client, filepath, offset, document) {
    // Workaround for https://github.com/microsoft/TypeScript/issues/12677
    // Don't complete function calls inside of destructive assignments or imports
    try {
        const response = client.getQuickInfoAtPosition(filepath, offset);
        if (response) {
            switch (response.kind) {
                case 'var':
                case 'let':
                case 'const':
                case 'alias':
                    return false;
            }
        }
    }
    catch {
        // Noop
    }
    // Don't complete function call if there is already something that looks like a function call
    // https://github.com/microsoft/vscode/issues/18131
    const position = document.positionAt(offset);
    const after = getLineText(document, position.line).slice(position.character);
    return after.match(/^[a-z_$0-9]*\s*\(/gi) === null;
}
function getLineText(document, line) {
    const endOffset = document.offsetAt({ line: line + 1, character: 0 });
    const end = document.positionAt(endOffset);
    const text = document.getText({
        start: { line: line, character: 0 },
        end: end.line === line ? end : document.positionAt(endOffset - 1),
    });
    return text;
}
exports.getLineText = getLineText;
//# sourceMappingURL=resolve.js.map