"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const previewer = require("../utils/previewer");
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return (uri, position, documentOnly = false) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return;
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const info = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getQuickInfoAtPosition(fileName, offset));
        if (!info)
            return;
        const parts = [];
        const displayString = ts.displayPartsToString(info.displayParts);
        const documentation = previewer.markdownDocumentation(info.documentation ?? [], info.tags, { toResource }, ctx);
        if (displayString && !documentOnly) {
            parts.push(['```typescript', displayString, '```'].join('\n'));
        }
        if (documentation) {
            parts.push(documentation);
        }
        const markdown = {
            kind: 'markdown',
            value: parts.join('\n\n'),
        };
        return {
            contents: markdown,
            range: {
                start: document.positionAt(info.textSpan.start),
                end: document.positionAt(info.textSpan.start + info.textSpan.length),
            },
        };
        function toResource(path) {
            return ctx.env.fileNameToUri(path);
        }
    };
}
exports.register = register;
//# sourceMappingURL=hover.js.map