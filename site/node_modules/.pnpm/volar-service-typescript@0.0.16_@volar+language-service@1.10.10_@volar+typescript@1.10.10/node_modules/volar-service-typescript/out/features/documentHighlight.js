"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const shared_1 = require("../shared");
function register(ctx) {
    const { ts } = ctx;
    return (uri, position) => {
        const document = ctx.getTextDocument(uri);
        if (!document)
            return [];
        const fileName = ctx.env.uriToFileName(document.uri);
        const offset = document.offsetAt(position);
        const highlights = (0, shared_1.safeCall)(() => ctx.typescript.languageService.getDocumentHighlights(fileName, offset, [fileName]));
        if (!highlights)
            return [];
        const results = [];
        for (const highlight of highlights) {
            for (const span of highlight.highlightSpans) {
                results.push({
                    kind: span.kind === ts.HighlightSpanKind.writtenReference ? 3 : 2,
                    range: {
                        start: document.positionAt(span.textSpan.start),
                        end: document.positionAt(span.textSpan.start + span.textSpan.length),
                    },
                });
            }
        }
        return results;
    };
}
exports.register = register;
//# sourceMappingURL=documentHighlight.js.map