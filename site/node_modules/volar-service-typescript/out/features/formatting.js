"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const getFormatCodeSettings_1 = require("../configs/getFormatCodeSettings");
const shared_1 = require("../shared");
function register(ctx) {
    return {
        onRange: async (document, range, options) => {
            const fileName = ctx.env.uriToFileName(document.uri);
            const tsOptions = await (0, getFormatCodeSettings_1.getFormatCodeSettings)(ctx, document, options);
            if (typeof (tsOptions.indentSize) === "boolean" || typeof (tsOptions.indentSize) === "string") {
                tsOptions.indentSize = undefined;
            }
            const scriptEdits = range
                ? (0, shared_1.safeCall)(() => ctx.typescript.languageService.getFormattingEditsForRange(fileName, document.offsetAt(range.start), document.offsetAt(range.end), tsOptions))
                : (0, shared_1.safeCall)(() => ctx.typescript.languageService.getFormattingEditsForDocument(fileName, tsOptions));
            if (!scriptEdits)
                return [];
            const result = [];
            for (const textEdit of scriptEdits) {
                result.push({
                    range: {
                        start: document.positionAt(textEdit.span.start),
                        end: document.positionAt(textEdit.span.start + textEdit.span.length),
                    },
                    newText: textEdit.newText,
                });
            }
            return result;
        },
        onType: async (document, options, position, key) => {
            const fileName = ctx.env.uriToFileName(document.uri);
            const tsOptions = await (0, getFormatCodeSettings_1.getFormatCodeSettings)(ctx, document, options);
            const scriptEdits = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getFormattingEditsAfterKeystroke(fileName, document.offsetAt(position), key, tsOptions));
            if (!scriptEdits)
                return [];
            const result = [];
            for (const textEdit of scriptEdits) {
                result.push({
                    range: {
                        start: document.positionAt(textEdit.span.start),
                        end: document.positionAt(textEdit.span.start + textEdit.span.length),
                    },
                    newText: textEdit.newText,
                });
            }
            return result;
        },
    };
}
exports.register = register;
//# sourceMappingURL=formatting.js.map