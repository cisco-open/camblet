"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const shared_1 = require("../shared");
function register(ctx) {
    return (uri, positions) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const result = [];
        for (const position of positions) {
            const fileName = ctx.env.uriToFileName(document.uri);
            const offset = document.offsetAt(position);
            const range = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getSmartSelectionRange(fileName, offset));
            if (!range)
                continue;
            result.push(transformSelectionRange(range, document));
        }
        return result;
    };
}
exports.register = register;
function transformSelectionRange(range, document) {
    return {
        range: {
            start: document.positionAt(range.textSpan.start),
            end: document.positionAt(range.textSpan.start + range.textSpan.length),
        },
        parent: range.parent ? transformSelectionRange(range.parent, document) : undefined,
    };
}
//# sourceMappingURL=selectionRanges.js.map